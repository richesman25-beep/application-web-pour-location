import {accountingErrorMessage} from './accountingErrors';
import {networkOnline} from './networkService';
import {httpsCallable} from 'firebase/functions';
import {functions} from '../firebase';
export async function accountingCall<T=any>(name:string,org:string,input:Record<string,unknown>={}):Promise<T>{
 if(!networkOnline())throw new Error('Cette opération nécessite une connexion Internet.');
 try{return (await httpsCallable<Record<string,unknown>,T>(functions,name)({...input,org})).data;}
 catch(e){throw new Error(accountingErrorMessage(e,name));}
}
export async function syncAccounting(org:string,onProgress:(text:string)=>void){
 const totals={created:0,adjusted:0,unchanged:0,errors:[] as {id:string;message:string}[]};
 for(const stage of ['invoices','payments']){let cursor:string|null=null;do{onProgress(`Import des ${stage==='invoices'?'factures':'paiements'}…`);const result:any=await accountingCall('accountingSync',org,{stage,cursor});totals.created+=result.created;totals.adjusted+=result.adjusted;totals.unchanged+=result.unchanged;totals.errors.push(...result.errors);cursor=result.nextCursor;}while(cursor);}
 return totals;
}
