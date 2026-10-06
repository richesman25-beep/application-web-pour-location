import {doc,runTransaction} from 'firebase/firestore';
import {db} from '../firebase';
import {validateProforma} from './proformaPolicy';
export async function saveProforma(org:string,input:any,company:any,id?:string){
 const p=(name:string,key:string)=>doc(db,'organizations',org,name,key);
 return runTransaction(db,async t=>{
  const existing=id?(await t.get(p('proformas',id))).data():undefined;
  if(id){if(!existing)throw new Error('Pro forma introuvable.');if(!['Brouillon','Envoyée'].includes(existing.status))throw new Error('Cette pro forma ne peut plus être modifiée.');}
  const customer=(await t.get(p('customers',input.customerId))).data(),asset=(await t.get(p('assets',input.assetId))).data();
  const counter=p('counters','proformas'),sequence=(await t.get(counter)).data()?.value||0;
  if(!customer||!asset)throw new Error('Choisissez un client et un bien valides.');if(customer.status==='Blacklisté')throw new Error('Ce client est blacklisté.');
  const values=validateProforma(input),key=id||`PF-${new Date().getFullYear()}-${String(sequence+1).padStart(5,'0')}`,now=new Date().toISOString();
  t.set(p('proformas',key),{...input,...values,paid:0,penalties:0,organizationId:org,status:existing?.status||'Brouillon',createdAt:existing?.createdAt||now,updatedAt:now,company,customer,assetName:asset.name,customerName:`${customer.firstName} ${customer.lastName}`});
  if(!id)t.set(counter,{organizationId:org,value:sequence+1});return key;
 });
}
export async function changeProformaStatus(org:string,id:string,status:'Envoyée'|'Annulée'){
 const target=doc(db,'organizations',org,'proformas',id);await runTransaction(db,async t=>{const q=(await t.get(target)).data();if(!q||!['Brouillon','Envoyée'].includes(q.status))throw new Error('Cette pro forma ne peut plus être modifiée.');t.update(target,{status,updatedAt:new Date().toISOString()});});
}
