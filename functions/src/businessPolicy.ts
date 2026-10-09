import {validId} from './adminPolicy';
import {cents} from './accountingPolicy';
import {units,pricing,duration} from './businessPricing';
export type Operation={id:string;uid:string;org:string;kind:string;args:any[];createdAt:string;expected?:{collection:string;id:string;value:string}};
export function stableStringify(v:any):string{if(Array.isArray(v))return '['+v.map(stableStringify).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stableStringify(v[k])).join(',')+'}';return JSON.stringify(v)??'null';}
const methods=['Cash HTG','Cash USD','MonCash','NatCash','Carte bancaire','Virement','Chèque','Crédit','Autre'];
const fields:Record<string,string[]>={customers:['firstName','lastName','phone','whatsapp','address','commune','department','cin','nif','reference','referencePhone','status','notes','photo'],assets:['name','code','categoryId','description','quantity','rate','currency','unit','deposit','condition','location','status','notes','photo'],categories:['name','description'],settings:['name','phone','whatsapp','address','email','currency','exchange','terms','prefix','logo']};
export function privatePhotoPath(value:unknown,org:string){
 if(value==='')return '';if(typeof value!=='string')throw new Error('Photo invalide.');let path=value;
 if(value.startsWith('https://')){const u=new URL(value);if(u.hostname!=='firebasestorage.googleapis.com')throw new Error('Origine de photo invalide.');const match=/^\/v0\/b\/[^/]+\/o\/(.+)$/.exec(u.pathname);if(!match)throw new Error('Photo invalide.');path=decodeURIComponent(match[1]);}
 if(!path.startsWith(`organizations/${org}/`)||path.includes('..')||path.includes('?')||path.includes('#')||path.length>500)throw new Error('Photo étrangère à cette entreprise.');return path;
}
function object(v:any){if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('Données invalides.');return v;}
function text(v:any,max=5000){if(typeof v!=='string'||v.length>max)throw new Error('Texte invalide.');return v;}
function pick(v:any,keys:string[]){object(v);const result:any={};for(const k of keys)if(v[k]!==undefined&&v[k]!==null)result[k]=v[k];return result;}
function choice(v:any,values:readonly string[]){if(!values.includes(v))throw new Error('Valeur invalide.');return v;}
export function rentalInput(v:any){const r=pick(v,['assetId','customerId','quantity','start','end','rate','unit','discount','fees','deposit','paid','method','currency','notes']);r.assetId=validId(r.assetId);r.customerId=validId(r.customerId);if(!Number.isInteger(r.quantity)||r.quantity<1||r.quantity>1e6)throw new Error('Quantité invalide.');choice(r.unit,units);choice(r.currency,['HTG','USD']);choice(r.method??'Cash HTG',methods);r.method=r.method??'Cash HTG';for(const k of ['rate','discount','fees','deposit','paid']){r[k]=r[k]??0;cents(r[k]);}for(const k of ['start','end']){text(r[k],40);if(!Number.isFinite(Date.parse(r[k])))throw new Error('Date invalide.');}if(r.notes!==undefined)text(r.notes);const p=pricing({...r,duration:duration(r.start,r.end,r.unit)});Object.values(p).forEach(cents);return r;}
export function normalizeOperation(data:any,uid:string,now:Date):Operation{
 object(data);const id=validId(data.id),org=validId(data.org),kind=choice(data.kind,['saveRow','createRental','pay','returnRental','saveProforma','changeProformaStatus','seed']);if(!Array.isArray(data.args)||data.args.length>4||stableStringify(data.args).length>100000)throw new Error('Arguments invalides.');let args=[...data.args];
 if(kind==='saveRow'){const name=choice(args[0],Object.keys(fields)),input=pick(args[1],fields[name]);for(const [k,v] of Object.entries(input))if(!(name==='assets'&&['quantity','rate','deposit'].includes(k)||name==='settings'&&k==='exchange'))text(v,k==='photo'||k==='logo'?2000:5000);if(input.name!==undefined&&!text(input.name,200).trim())throw new Error('Nom obligatoire.');for(const k of ['photo','logo'])if(input[k]!==undefined)input[k]=privatePhotoPath(input[k],org);
  if(args[2])validId(args[2]);if(name==='settings'&&args[2]!=='company')throw new Error('Paramètres invalides.');
  if(name==='assets'){if(!Number.isInteger(input.quantity)||input.quantity<1||input.quantity>1e6)throw new Error('Quantité invalide.');cents(input.rate);cents(input.deposit??0);choice(input.currency,['HTG','USD']);choice(input.unit,units);validId(input.categoryId);choice(input.status,['Disponible','Loué','Réservé','Maintenance','Endommagé','Perdu','Hors service']);}
  if(name==='customers')choice(input.status,['Normal','VIP','Débiteur','Blacklisté']);
  if(name==='settings'){if(input.prefix!==undefined&&!/^[A-Z0-9-]{2,12}$/.test(input.prefix))throw new Error('Préfixe invalide.');if(input.exchange!==undefined&&(!Number.isFinite(input.exchange)||input.exchange<=0||input.exchange>1e9))throw new Error('Taux invalide.');if(input.currency!==undefined)choice(input.currency,['HTG','USD']);}
  if(!args[2])for(const k of name==='customers'?['firstName','lastName','phone']:['name'])if(!text(input[k],200).trim())throw new Error('Champ obligatoire.');args=[name,input,args[2]||undefined];
 }else if(kind==='createRental'){if(args[1]){validId(args[1]);args=[{},args[1]];}else args=[rentalInput(args[0])];}
 else if(kind==='pay'){args=[validId(args[0]),args[1],choice(args[2],methods)];if(cents(args[1])<=0)throw new Error('Paiement positif requis.');}
 else if(kind==='returnRental'){const v=pick(args[1],['actualReturn','returnState','penalties','damageFees','returnNotes','returnPhoto']);if(!Number.isFinite(Date.parse(text(v.actualReturn,40))))throw new Error('Date de retour invalide.');choice(v.returnState,['Bon état','Endommagé','Incomplet','Perdu']);cents(v.penalties);cents(v.damageFees??0);if(v.returnNotes!==undefined)text(v.returnNotes);if(v.returnPhoto!==undefined)v.returnPhoto=privatePhotoPath(v.returnPhoto,org);args=[validId(args[0]),v];}
 else if(kind==='saveProforma'){const v={...rentalInput({...args[0],paid:0,method:'Cash HTG'}),validUntil:text(args[0].validUntil,10)};args=[v,{},args[2]?validId(args[2]):undefined];}
 else if(kind==='changeProformaStatus')args=[validId(args[0]),choice(args[1],['Envoyée','Annulée'])];
 else args=[];
 let expected:Operation['expected'];if(data.expected){const e=object(data.expected);choice(e.collection,['customers','assets','categories','settings','proformas']);expected={collection:e.collection,id:validId(e.id),value:text(e.value,100000)};}
 return {id,org,uid,kind,args:JSON.parse(JSON.stringify(args)),createdAt:now.toISOString(),...(expected?{expected}:{})};
}
