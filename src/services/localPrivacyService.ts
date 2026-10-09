import {signOut} from 'firebase/auth';
import {terminate,clearIndexedDbPersistence} from 'firebase/firestore';
import {auth,db} from '../firebase';
import {operations,deleteOperation} from './offlineStore';
export async function pruneSyncedOperations(uid:string){const cutoff=Date.now()-30*86400000;for(const op of await operations())if(op.uid===uid&&op.status==='synced'&&Date.parse(op.createdAt)<cutoff)await deleteOperation(op.id);}
export async function clearLocalData(){
 const rows=await operations();if(rows.some(op=>op.status!=='synced'))throw new Error('Des saisies restent en attente ou à vérifier sur cet appareil. Synchronisez-les ou sauvegardez-les et retirez-les depuis leur compte avant d’effacer les données locales.');
 await signOut(auth);await terminate(db);
 try{await clearIndexedDbPersistence(db);}catch{window.location.replace('/login');throw new Error('Fermez les autres onglets de l’application, puis réessayez.');}
 await new Promise<void>((resolve,reject)=>{const request=indexedDB.deleteDatabase('lokasyon-outbox-v1');request.onsuccess=()=>resolve();request.onerror=()=>reject(new Error('Stockage local non effacé.'));request.onblocked=()=>reject(new Error('Fermez les autres onglets avant de réessayer.'));});
 for(let n=localStorage.length-1;n>=0;n--){const key=localStorage.key(n);if(key?.startsWith('organization-'))localStorage.removeItem(key);}sessionStorage.removeItem('organizationId');window.location.replace('/login');
}
