import {createHash} from 'node:crypto';
import {getFirestore,type Transaction} from 'firebase-admin/firestore';
import {getAuth} from 'firebase-admin/auth';
import {onCall,HttpsError} from 'firebase-functions/v2/https';
import {validId} from './adminPolicy';
import {cents} from './accountingPolicy';
import {pricing,duration,assertConvertible,validateProforma} from './businessPricing';
import {normalizeOperation,stableStringify,rentalInput,type Operation} from './businessPolicy';

export async function authorizeBusiness(t:Transaction,org:string,uid:string,admin=false){
 const db=getFirestore();const [organization,member,status,site]=await t.getAll(db.doc(`organizations/${org}`),db.doc(`organizations/${org}/users/${uid}`),db.doc(`accountStatus/${uid}`),db.doc('platform/settings'));
 if(!organization.exists||organization.data()?.status==='suspended'||!member.exists||member.data()?.disabled===true||!['admin','employee'].includes(member.data()?.role)||status.data()?.disabled===true||site.data()?.maintenance===true||(admin&&member.data()?.role!=='admin'))throw new HttpsError('permission-denied','Accès refusé à cette entreprise.');
}
async function operationTransaction<T>(op:Operation,fn:(t:Transaction)=>Promise<T>):Promise<T>{
 const db=getFirestore(),signature=createHash('sha256').update(stableStringify({uid:op.uid,org:op.org,kind:op.kind,args:op.args,expected:op.expected||null})).digest('hex');
 return db.runTransaction(async t=>{
  await authorizeBusiness(t,op.org,op.uid,op.kind==='seed'||op.kind==='saveRow'&&['categories','settings'].includes(op.args[0]));
  const receipt=db.doc(`organizations/${op.org}/offlineOperations/${op.id}`),old=await t.get(receipt);
  if(old.exists){if(old.data()?.createdBy!==op.uid||old.data()?.signature!==signature)throw new HttpsError('already-exists','Identifiant d’opération déjà utilisé avec des données différentes.');return old.data()!.result as T;}
  if(op.expected){const current=await t.get(path(op.org,op.expected.collection,op.expected.id));if(stableStringify(current.data())!==op.expected.value)throw new HttpsError('failed-precondition','Cet enregistrement a changé depuis la saisie. Vérifiez la version actuelle avant de le modifier.');}
  const result=await fn(t);t.create(receipt,{organizationId:op.org,createdBy:op.uid,createdAt:op.createdAt,kind:op.kind,result:result??null,signature});
  t.create(db.collection(`organizations/${op.org}/businessAudit`).doc(),{organizationId:op.org,actor:op.uid,action:op.kind,operationId:op.id,createdAt:op.createdAt});return result;
 });
}
const year=()=>new Date().getFullYear();
const path=(org:string,name:string,id:string)=>getFirestore().doc(`organizations/${validId(org)}/${validId(name)}/${validId(id)}`);
function next(value:unknown){const n=value??0;if(typeof n!=='number'||!Number.isSafeInteger(n)||n<0||n>=1e9)throw new Error('Compteur invalide. Contactez l’administrateur.');return n+1;}
function validStoredRental(r:any){if(!r)throw new Error('Location introuvable.');for(const k of ['rentalTotal','deposit','total','paid','balance'])cents(r[k]);if(!['HTG','USD'].includes(r.currency)||Math.abs(r.total-r.rentalTotal-r.deposit)>0.00001||Math.abs(r.balance-r.total+r.paid)>0.00001)throw new Error('Montants existants incohérents. Une vérification administrative est nécessaire.');}
function validStock(a:any):asserts a is Record<string,any>{if(!a||!Number.isInteger(a.quantity)||a.quantity<1||!Number.isInteger(a.available)||a.available<0||a.available>a.quantity||!Number.isInteger(a.quarantined??0)||(a.quarantined??0)<0||(a.quarantined??0)+a.available>a.quantity)throw new Error('Stock existant incohérent. Une vérification administrative est nécessaire.');}
const generated=(prefix:string,n:number)=>`${prefix}-${String(n).padStart(5,'0')}`;
async function saveRowNow(op:Operation,org:string,name:string,input:any,id?:string){
 if(id){
 if(name==='settings'&&id==='company'&&typeof input.name==='string')return operationTransaction(op,async t=>{if(name!=='settings'&&!(await t.get(path(org,name,id))).exists)throw new Error('Fiche introuvable.');t.set(path(org,name,id),{...input,organizationId:org},{merge:true});t.update(getFirestore().doc(`organizations/${org}`),{name:input.name});return id;});
 if(name==='assets')return operationTransaction(op,async t=>{if(!(await t.get(path(org,'categories',input.categoryId))).exists)throw new Error('Catégorie introuvable.');const target=path(org,name,id),current=(await t.get(target)).data();if(!current)throw new Error('Bien introuvable.');validStock(current);const occupied=current.quantity-current.available;if(!Number.isInteger(input.quantity)||input.quantity<Math.max(1,occupied))throw new Error('La quantité totale est inférieure au stock occupé.');t.update(target,{...input,available:input.quantity-occupied,quarantined:current.quarantined||0,organizationId:org});return id;});
 return operationTransaction(op,async t=>{if(name!=='settings'&&!(await t.get(path(org,name,id))).exists)throw new Error('Fiche introuvable.');t.set(path(org,name,id),{...input,organizationId:org},{merge:true});return id;});
 }
 return operationTransaction(op,async t=>{if(name==='assets'&&!(await t.get(path(org,'categories',input.categoryId))).exists)throw new Error('Catégorie introuvable.');
 const counter=path(org,'counters',name),s=await t.get(counter),n=next(s.data()?.value);
 const code=generated(({customers:'CLI',assets:'BIEN',categories:'CAT'} as any)[name]||name,n);
 t.set(counter,{value:n,organizationId:org});t.create(path(org,name,code),{...input,...(name==='assets'?{available:input.quantity,quarantined:0}:{}),code:input.code||code,organizationId:org,createdAt:op.createdAt});return code;});
}
async function createRentalNow(op:Operation,org:string,input:any,proformaId?:string){
 return operationTransaction(op,async t=>{
 if(proformaId){const q=(await t.get(path(org,'proformas',proformaId))).data();if(q?.status==='Convertie')return q.rentalId as string;assertConvertible(q);const fields=['assetId','customerId','quantity','start','end','rate','unit','discount','fees','deposit','currency','notes'];input={...Object.fromEntries(fields.map(k=>[k,q![k]])),paid:0,method:'Cash HTG',invoicePrefix:input.invoicePrefix,proformaId};}
 input=rentalInput(input);const company=(await t.get(path(org,'settings','company'))).data();
 const ar=path(org,'assets',input.assetId),a=(await t.get(ar)).data();
 const customer=(await t.get(path(org,'customers',input.customerId))).data();
 const rc=path(org,'counters','rentals'),pc=path(org,'counters','payments');const rs=await t.get(rc),ps=await t.get(pc);
 if(!a||!customer)throw new Error('Choisissez un client et un bien valides.');
 if(customer.status==='Blacklisté')throw new Error('Ce client est blacklisté.');validStock(a);
 if(!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>a.available||['Réservé','Maintenance','Endommagé','Perdu','Hors service'].includes(a.status))throw new Error('Quantité indisponible.');
 const count=duration(input.start,input.end,input.unit);const price=pricing({...input,duration:count});
 const id=generated(`LOC-${new Date(op.createdAt).getFullYear()}`,next(rs.data()?.value)),invoice=id.replace('LOC',/^[A-Z0-9-]{2,12}$/.test(company?.prefix||'')?company!.prefix:'FAC');
 const rental={...input,...price,duration:count,assetName:a.name,customerName:`${customer.firstName} ${customer.lastName}`,phone:customer.whatsapp||customer.phone||'',status:'Active',invoice,createdAt:op.createdAt,organizationId:org};
 t.set(rc,{value:next(rs.data()?.value),organizationId:org});t.create(path(org,'rentals',id),{...rental,...(proformaId?{proformaId}:{})});t.create(path(org,'invoices',invoice),{organizationId:org,rentalId:id,createdAt:rental.createdAt});
 if(proformaId)t.update(path(org,'proformas',proformaId),{status:'Convertie',rentalId:id,invoiceId:invoice,convertedAt:rental.createdAt,updatedAt:rental.createdAt});
 t.update(ar,{available:a.available-input.quantity,status:a.available-input.quantity===0?'Loué':'Disponible'});
 if(input.paid>0){const n=next(ps.data()?.value);t.set(pc,{value:n,organizationId:org});t.create(path(org,'payments',generated(`PAY-${new Date(op.createdAt).getFullYear()}`,n)),{organizationId:org,rentalId:id,amount:input.paid,currency:input.currency,method:input.method,date:rental.createdAt});}
 return id;});
}
async function payNow(op:Operation,org:string,rentalId:string,amount:number,method:string){
 return operationTransaction(op,async t=>{const rr=path(org,'rentals',rentalId),r=(await t.get(rr)).data();const pc=path(org,'counters','payments'),s=await t.get(pc);
 validStoredRental(r);if(!r||!Number.isFinite(amount)||amount<=0||amount>r.balance)throw new Error('Le paiement doit être positif et ne pas dépasser le solde.');
 const n=next(s.data()?.value);t.set(pc,{value:n,organizationId:org});t.create(path(org,'payments',generated(`PAY-${new Date(op.createdAt).getFullYear()}`,n)),{organizationId:org,rentalId,amount,method,currency:r.currency,date:op.createdAt});t.update(rr,{paid:Math.round((r.paid+amount)*100)/100,balance:Math.round((r.balance-amount)*100)/100});});
}
async function returnRentalNow(op:Operation,org:string,id:string,input:any){
 return operationTransaction(op,async t=>{const rr=path(org,'rentals',id),r=(await t.get(rr)).data();validStoredRental(r);if(!r||r.status!=='Active')throw new Error('Cette location est déjà clôturée.');
 const ar=path(org,'assets',r.assetId),a=(await t.get(ar)).data();validStock(a);if(a.available+r.quantity>a.quantity-(a.quarantined??0))throw new Error('Stock de retour incohérent.');
 if(!Number.isFinite(input.penalties)||input.penalties<0||Date.parse(input.actualReturn)<Date.parse(r.start)||Date.parse(input.actualReturn)>Date.now()+300000)throw new Error('Date de retour ou pénalités invalides.');
 const p=pricing({quantity:r.quantity,rate:r.rate,duration:r.duration,discount:r.discount,fees:r.fees,deposit:r.deposit,paid:r.paid,penalties:input.penalties});Object.values(p).forEach(cents);t.update(rr,{...input,...p,status:'Terminée'});
 const good=input.returnState==='Bon état';t.update(ar,{available:good?a.available+r.quantity:a.available,quarantined:(a.quarantined||0)+(good?0:r.quantity),status:good?'Disponible':(a.available>0?'Disponible':input.returnState==='Perdu'?'Perdu':'Endommagé')});});
}
async function saveProformaNow(op:Operation,org:string,input:any,company:any,id?:string){
 const p=(name:string,key:string)=>path(org,name,key);
 return operationTransaction(op,async t=>{
  const existing=id?(await t.get(p('proformas',id))).data():undefined;
  if(id){if(!existing)throw new Error('Pro forma introuvable.');if(!['Brouillon','Envoyée'].includes(existing.status))throw new Error('Cette pro forma ne peut plus être modifiée.');}
  const customer=(await t.get(p('customers',input.customerId))).data(),asset=(await t.get(p('assets',input.assetId))).data();
  const counter=p('counters','proformas'),sequence=(await t.get(counter)).data()?.value||0;
  if(!customer||!asset)throw new Error('Choisissez un client et un bien valides.');if(customer.status==='Blacklisté')throw new Error('Ce client est blacklisté.');
  company={name:'LOKASYON LAKAY',...(await t.get(path(org,'settings','company'))).data()};
  const values=validateProforma(input),key=id||`PF-${new Date(op.createdAt).getFullYear()}-${String(next(sequence)).padStart(5,'0')}`,now=op.createdAt;
  t.set(p('proformas',key),{...input,...values,paid:0,penalties:0,organizationId:org,status:existing?.status||'Brouillon',createdAt:existing?.createdAt||now,updatedAt:now,company,customer,assetName:asset.name,customerName:`${customer.firstName} ${customer.lastName}`});
  if(!id)t.set(counter,{organizationId:org,value:next(sequence)});return key;
 });
}
async function changeProformaStatusNow(op:Operation,org:string,id:string,status:'Envoyée'|'Annulée'){
 const target=path(org,'proformas',id);await operationTransaction(op,async t=>{const q=(await t.get(target)).data();if(!q||!['Brouillon','Envoyée'].includes(q.status))throw new Error('Cette pro forma ne peut plus être modifiée.');t.update(target,{status,updatedAt:op.createdAt});});
}

async function seedNow(op:Operation,org:string){
 return operationTransaction(op,async t=>{
 if(!process.env.FIRESTORE_EMULATOR_HOST)throw new HttpsError('permission-denied','Démonstration locale uniquement.');
 for(const name of ['customers','assets','rentals'])if(!(await t.get(getFirestore().collection(`organizations/${org}/${name}`).limit(1))).empty)throw new Error('La démonstration exige une entreprise vide.');
 const add=(c:string,id:string,data:any)=>t.set(path(org,c,id),{...data,organizationId:org});
 ['Voitures','Génératrices','Électronique','Événementiel','Immobilier'].forEach((name,i)=>add('categories',`CAT-${i+1}`,{name}));
 ['Jean Pierre','Marie Joseph','Samuel Louis'].forEach((name,i)=>add('customers',generated('CLI',i+1),{firstName:name.split(' ')[0],lastName:name.split(' ')[1],phone:`+5093700000${i}`,status:'Normal'}));
 ['Toyota RAV4','Génératrice 6.5 kW','Power Bank','Chaises','Tente événementielle','Appartement 2 chambres'].forEach((name,i)=>add('assets',generated('BIEN',i+1),{name,categoryId:`CAT-${[1,2,3,4,4,5][i]}`,quantity:i===3?100: i===2?10:1,available:i===0?0:i===3?90:i===2?10:1,rate:[8000,2500,250,75,5000,12000][i],deposit:0,currency:'HTG',unit:'jour',status:i===0?'Loué':'Disponible',condition:'Bon état',location:'Port-au-Prince'}));
 const now=new Date(),date=(offset:number)=>new Date(now.getTime()+offset*86400000).toISOString();
 const rentals=[{assetId:'BIEN-00001',assetName:'Toyota RAV4',customerId:'CLI-00001',customerName:'Jean Pierre',quantity:1,rate:8000,start:date(-3),end:date(-1),paid:5000,status:'Active'}, {assetId:'BIEN-00004',assetName:'Chaises',customerId:'CLI-00002',customerName:'Marie Joseph',quantity:10,rate:75,start:date(0),end:date(2),paid:500,status:'Active'}, {assetId:'BIEN-00002',assetName:'Génératrice 6.5 kW',customerId:'CLI-00003',customerName:'Samuel Louis',quantity:1,rate:2500,start:date(-5),end:date(-4),paid:2500,status:'Terminée'}];
 rentals.forEach((r,i)=>{const id=generated(`LOC-${year()}`,i+1),invoice=id.replace('LOC','FAC'),count=duration(r.start,r.end,'jour');add('rentals',id,{...r,...pricing({...r,duration:count}),duration:count,currency:'HTG',unit:'jour',invoice,phone:'+50937000000',createdAt:r.start});add('invoices',invoice,{rentalId:id,createdAt:r.start});add('payments',generated(`PAY-${year()}`,i+1),{rentalId:id,amount:r.paid,currency:'HTG',method:'Cash HTG',date:r.start});});
 for(const [name,value] of Object.entries({customers:3,assets:6,categories:5,rentals:3,payments:3}))add('counters',name,{value});
 return null;
 });
}


export const businessOperation=onCall({region:'us-central1',maxInstances:5,timeoutSeconds:120},async request=>{
 if(!request.auth)throw new HttpsError('unauthenticated','Connectez-vous pour continuer.');
 const account=await getAuth().getUser(request.auth.uid);if(!account.emailVerified)throw new HttpsError('permission-denied','Confirmez votre adresse email.');if(account.disabled)throw new HttpsError('permission-denied','Compte suspendu.');
 try{
  const op=normalizeOperation(request.data,request.auth.uid,new Date());
  switch(op.kind){
   case 'saveRow':return (await saveRowNow(op,op.org,op.args[0],op.args[1],op.args[2]))??null;
   case 'createRental':return (await createRentalNow(op,op.org,op.args[0],op.args[1]))??null;
   case 'pay':return (await payNow(op,op.org,op.args[0],op.args[1],op.args[2]))??null;
   case 'returnRental':return (await returnRentalNow(op,op.org,op.args[0],op.args[1]))??null;
   case 'saveProforma':return (await saveProformaNow(op,op.org,op.args[0],op.args[1],op.args[2]))??null;
   case 'changeProformaStatus':return (await changeProformaStatusNow(op,op.org,op.args[0],op.args[1]))??null;
   case 'seed':return await seedNow(op,op.org);
   default:throw new HttpsError('invalid-argument','Opération inconnue.');
  }
 }catch(error){if(error instanceof HttpsError)throw error;throw new HttpsError('invalid-argument',error instanceof Error?error.message:'Données invalides.');}
});
