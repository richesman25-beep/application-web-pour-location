import {networkOnline} from './networkService';
import {doc,getDocFromCache,getDocFromServer} from 'firebase/firestore';
import {httpsCallable} from 'firebase/functions';
import {auth,db,functions} from '../firebase';
import {pruneSyncedOperations} from './localPrivacyService';
import {operations,putOperation,deleteOperation,fingerprint,type Operation} from './offlineStore';
export class QueuedOperation extends Error{constructor(){super('Enregistré sur cet appareil, en attente de synchronisation. Consultez la file d’attente.');this.name='QueuedOperation';}}
export const isQueued=(e:unknown)=>e instanceof QueuedOperation;
const listeners=new Set<()=>void>();export const subscribeOffline=(fn:()=>void)=>{listeners.add(fn);return()=>{listeners.delete(fn);};};
const channel=typeof BroadcastChannel!=='undefined'?new BroadcastChannel('lokasyon-outbox'):null;
const notify=()=>{listeners.forEach(fn=>fn());channel?.postMessage('changed');};channel?.addEventListener('message',()=>listeners.forEach(fn=>fn()));
let syncing=false;export const isSyncing=()=>syncing;
const transient=(e:any)=>!networkOnline()||['unavailable','deadline-exceeded','cancelled','aborted'].includes(String(e?.code).replace(/^(firestore|functions)\//,''));
async function execute(op:Operation){try{
 if(auth.currentUser?.uid!==op.uid)throw new Error('Reconnectez-vous avec le compte ayant saisi cette opération.');
 const result=(await httpsCallable<any,any>(functions,'businessOperation')({id:op.id,org:op.org,kind:op.kind,args:op.args,...(op.expected?{expected:op.expected}:{})})).data;
 await putOperation({...op,status:'synced',result:result??null,error:''});notify();return result;
 }catch(e){if(!transient(e)){await putOperation({...op,status:'conflict',error:(e as Error).message});notify();}throw e;}}
export async function submitOperation(kind:string,org:string,args:any[],target?:{collection:string;id:string}){
 const uid=auth.currentUser?.uid;if(!uid)throw new Error('Connectez-vous avant de saisir des données.');
 const cleanArgs=JSON.parse(JSON.stringify(args)),existing=(await operations()).find(o=>o.uid===uid&&o.org===org&&o.status==='pending'&&o.kind===kind&&fingerprint(o.args)===fingerprint(cleanArgs));
 const op:Operation=existing||{id:crypto.randomUUID(),uid,org,kind,args:cleanArgs,createdAt:new Date().toISOString(),status:'pending'};
 if(!existing&&target){const reference=doc(db,'organizations',org,target.collection,target.id);let value=await getDocFromCache(reference).catch(()=>null);if(!value&&networkOnline())value=await getDocFromServer(reference);if(!value)throw new Error('Ouvrez cet enregistrement en ligne avant de le modifier.');op.expected={...target,value:fingerprint(value.data())};}
 await putOperation(op);notify();if(!networkOnline())throw new QueuedOperation();
 try{return await execute(op);}catch(e){if(transient(e))throw new QueuedOperation();throw e;}
}
export async function syncOperations(org:string){if(syncing||!networkOnline()||!auth.currentUser)return;syncing=true;notify();const uid=auth.currentUser.uid;try{await pruneSyncedOperations(uid);for(const op of (await operations()).filter(o=>o.uid===uid&&o.org===org&&o.status==='pending').sort((a,b)=>a.createdAt.localeCompare(b.createdAt))){if(!networkOnline()||auth.currentUser?.uid!==uid)break;try{await execute(op);}catch(e){if(transient(e))break;}}}finally{syncing=false;notify();}}
export async function discardOperation(op:Operation){if(op.uid!==auth.currentUser?.uid||op.status==='pending'&&syncing)throw new Error('Attendez la fin de la synchronisation.');await deleteOperation(op.id);notify();}
export async function retryOperation(op:Operation){if(op.uid!==auth.currentUser?.uid)throw new Error('Compte incorrect.');await putOperation({...op,status:'pending',error:''});notify();}
