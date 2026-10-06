import {httpsCallable} from 'firebase/functions';
import {functions} from '../firebase';
export async function adminCall<T=unknown>(name:string,values:Record<string,unknown>={}):Promise<T>{
 try{return (await httpsCallable<Record<string,unknown>,T>(functions,name)(values)).data;}
 catch(e){const code=(e as {code?:string}).code;if(code==='functions/not-found'||code==='functions/unavailable'||code==='functions/internal')throw new Error('Le service d’administration est indisponible. Vérifiez le déploiement des fonctions Firebase (voir SUPERADMIN.md).');throw e;}
}
