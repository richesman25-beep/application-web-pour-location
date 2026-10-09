import {submitOperation} from './offlineService';
export const saveProforma=(org:string,input:any,company:any,id?:string):Promise<string>=>submitOperation('saveProforma',org,[input,company,id],id?{collection:'proformas',id}:undefined);
export const changeProformaStatus=(org:string,id:string,status:'Envoyée'|'Annulée')=>submitOperation('changeProformaStatus',org,[id,status],{collection:'proformas',id});
