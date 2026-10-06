import {collection,doc,runTransaction,setDoc,writeBatch} from 'firebase/firestore';
import {ref,uploadBytes,getDownloadURL} from 'firebase/storage';
import {db,storage} from '../firebase';
import {pricing,duration} from './pricingService';
import type {Row} from '../types';
const year=()=>new Date().getFullYear();
const path=(org:string,name:string,id:string)=>doc(db,'organizations',org,name,id);
const generated=(prefix:string,n:number)=>`${prefix}-${String(n).padStart(5,'0')}`;
export async function saveRow(org:string,name:string,input:any,id?:string){
 if(id){
 if(name==='settings'&&id==='company'&&typeof input.name==='string'){const batch=writeBatch(db);batch.set(path(org,name,id),{...input,organizationId:org},{merge:true});batch.update(doc(db,'organizations',org),{name:input.name});await batch.commit();return id;}
 if(name==='assets')return runTransaction(db,async t=>{const target=path(org,name,id),current=(await t.get(target)).data();if(!current)throw new Error('Bien introuvable.');const occupied=current.quantity-current.available;if(!Number.isInteger(input.quantity)||input.quantity<Math.max(1,occupied))throw new Error('La quantité totale est inférieure au stock occupé.');t.update(target,{...input,available:input.quantity-occupied,quarantined:current.quarantined||0,organizationId:org});return id;});
 await setDoc(path(org,name,id),{...input,organizationId:org},{merge:true});return id;
 }
 return runTransaction(db,async t=>{const counter=path(org,'counters',name),s=await t.get(counter),n=(s.data()?.value||0)+1;
 const code=generated(({customers:'CLI',assets:'BIEN',categories:'CAT'} as any)[name]||name,n);
 t.set(counter,{value:n,organizationId:org});t.set(path(org,name,code),{...input,code:input.code||code,organizationId:org,createdAt:new Date().toISOString()});return code;});
}
export async function createRental(org:string,input:any){
 return runTransaction(db,async t=>{
 const ar=path(org,'assets',input.assetId),a=(await t.get(ar)).data();
 const customer=(await t.get(path(org,'customers',input.customerId))).data();
 const rc=path(org,'counters','rentals'),pc=path(org,'counters','payments');const rs=await t.get(rc),ps=await t.get(pc);
 if(!a||!customer)throw new Error('Choisissez un client et un bien valides.');
 if(customer.status==='Blacklisté')throw new Error('Ce client est blacklisté.');
 if(!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>a.available||['Réservé','Maintenance','Endommagé','Perdu','Hors service'].includes(a.status))throw new Error('Quantité indisponible.');
 const count=duration(input.start,input.end,input.unit);const price=pricing({...input,duration:count});
 const id=generated(`LOC-${year()}`,(rs.data()?.value||0)+1),invoice=id.replace('LOC',input.invoicePrefix||'FAC');
 const rental={...input,...price,duration:count,assetName:a.name,customerName:`${customer.firstName} ${customer.lastName}`,phone:customer.whatsapp||customer.phone,status:'Active',invoice,createdAt:new Date().toISOString(),organizationId:org};
 t.set(rc,{value:(rs.data()?.value||0)+1,organizationId:org});t.set(path(org,'rentals',id),rental);t.set(path(org,'invoices',invoice),{organizationId:org,rentalId:id,createdAt:rental.createdAt});
 t.update(ar,{available:a.available-input.quantity,status:a.available-input.quantity===0?'Loué':'Disponible'});
 if(input.paid>0){const n=(ps.data()?.value||0)+1;t.set(pc,{value:n,organizationId:org});t.set(path(org,'payments',generated(`PAY-${year()}`,n)),{organizationId:org,rentalId:id,amount:input.paid,currency:input.currency,method:input.method,date:rental.createdAt});}
 return id;});
}
export async function pay(org:string,rentalId:string,amount:number,method:string){
 return runTransaction(db,async t=>{const rr=path(org,'rentals',rentalId),r=(await t.get(rr)).data();const pc=path(org,'counters','payments'),s=await t.get(pc);
 if(!r||!Number.isFinite(amount)||amount<=0||amount>r.balance)throw new Error('Le paiement doit être positif et ne pas dépasser le solde.');
 const n=(s.data()?.value||0)+1;t.set(pc,{value:n,organizationId:org});t.set(path(org,'payments',generated(`PAY-${year()}`,n)),{organizationId:org,rentalId,amount,method,currency:r.currency,date:new Date().toISOString()});t.update(rr,{paid:r.paid+amount,balance:Math.round((r.balance-amount)*100)/100});});
}
export async function returnRental(org:string,id:string,input:any){
 return runTransaction(db,async t=>{const rr=path(org,'rentals',id),r=(await t.get(rr)).data();if(!r||r.status!=='Active')throw new Error('Cette location est déjà clôturée.');
 const ar=path(org,'assets',r.assetId),a=(await t.get(ar)).data();if(!a)throw new Error('Bien introuvable.');
 if(!Number.isFinite(input.penalties)||input.penalties<0||Date.parse(input.actualReturn)<Date.parse(r.start))throw new Error('Date de retour ou pénalités invalides.');
 const p=pricing({quantity:r.quantity,rate:r.rate,duration:r.duration,discount:r.discount,fees:r.fees,deposit:r.deposit,paid:r.paid,penalties:input.penalties});t.update(rr,{...input,...p,status:'Terminée'});
 const good=input.returnState==='Bon état';t.update(ar,{available:good?a.available+r.quantity:a.available,quarantined:(a.quarantined||0)+(good?0:r.quantity),status:good?'Disponible':(a.available>0?'Disponible':input.returnState==='Perdu'?'Perdu':'Endommagé')});});
}
export async function uploadPhoto(org:string,file:File){
 if(!file.type.startsWith('image/')||file.size>5*1024*1024)throw new Error('Choisissez une image de moins de 5 Mo.');
 const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas'),scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));canvas.width=bitmap.width*scale;canvas.height=bitmap.height*scale;canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image invalide')),'image/jpeg',.8));
 const target=ref(storage,`organizations/${org}/${crypto.randomUUID()}.jpg`);await uploadBytes(target,blob);return getDownloadURL(target);
}
export async function seed(org:string){
 const batch=writeBatch(db);const add=(c:string,id:string,data:any)=>batch.set(path(org,c,id),{...data,organizationId:org});
 ['Voitures','Génératrices','Électronique','Événementiel','Immobilier'].forEach((name,i)=>add('categories',`CAT-${i+1}`,{name}));
 ['Jean Pierre','Marie Joseph','Samuel Louis'].forEach((name,i)=>add('customers',generated('CLI',i+1),{firstName:name.split(' ')[0],lastName:name.split(' ')[1],phone:`+5093700000${i}`,status:'Normal'}));
 ['Toyota RAV4','Génératrice 6.5 kW','Power Bank','Chaises','Tente événementielle','Appartement 2 chambres'].forEach((name,i)=>add('assets',generated('BIEN',i+1),{name,categoryId:`CAT-${[1,2,3,4,4,5][i]}`,quantity:i===3?100: i===2?10:1,available:i===0?0:i===3?90:i===2?10:1,rate:[8000,2500,250,75,5000,12000][i],deposit:0,currency:'HTG',unit:'jour',status:i===0?'Loué':'Disponible',condition:'Bon état',location:'Port-au-Prince'}));
 const now=new Date(),date=(offset:number)=>new Date(now.getTime()+offset*86400000).toISOString();
 const rentals=[{assetId:'BIEN-00001',assetName:'Toyota RAV4',customerId:'CLI-00001',customerName:'Jean Pierre',quantity:1,rate:8000,start:date(-3),end:date(-1),paid:5000,status:'Active'}, {assetId:'BIEN-00004',assetName:'Chaises',customerId:'CLI-00002',customerName:'Marie Joseph',quantity:10,rate:75,start:date(0),end:date(2),paid:500,status:'Active'}, {assetId:'BIEN-00002',assetName:'Génératrice 6.5 kW',customerId:'CLI-00003',customerName:'Samuel Louis',quantity:1,rate:2500,start:date(-5),end:date(-4),paid:2500,status:'Terminée'}];
 rentals.forEach((r,i)=>{const id=generated(`LOC-${year()}`,i+1),invoice=id.replace('LOC','FAC'),count=duration(r.start,r.end,'jour');add('rentals',id,{...r,...pricing({...r,duration:count}),duration:count,currency:'HTG',unit:'jour',invoice,phone:'+50937000000',createdAt:r.start});add('invoices',invoice,{rentalId:id,createdAt:r.start});add('payments',generated(`PAY-${year()}`,i+1),{rentalId:id,amount:r.paid,currency:'HTG',method:'Cash HTG',date:r.start});});
 for(const [name,value] of Object.entries({customers:3,assets:6,categories:5,rentals:3,payments:3}))add('counters',name,{value});
 await batch.commit();
}
