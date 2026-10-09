import {networkOnline} from './networkService';
import {submitOperation} from './offlineService';
import {httpsCallable} from 'firebase/functions';
import {functions} from '../firebase';
export async function uploadPhoto(org:string,file:File){
 if(!networkOnline())throw new Error('Les photos nécessitent une connexion. Enregistrez sans photo, puis ajoutez-la en ligne.');
 if(!file.type.startsWith('image/')||file.size>5*1024*1024)throw new Error('Choisissez une image de moins de 5 Mo.');
 const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas'),scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height));canvas.width=bitmap.width*scale;canvas.height=bitmap.height*scale;canvas.getContext('2d')!.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Image invalide')),'image/jpeg',.8));
 const bytes=new Uint8Array(await blob.arrayBuffer());let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return (await httpsCallable<any,string>(functions,'uploadPrivatePhoto')({org,data:btoa(binary)})).data;
}

export const seed=(org:string)=>submitOperation('seed',org,[]);
export const saveRow=(org:string,name:string,input:any,id?:string):Promise<string>=>submitOperation('saveRow',org,[name,input,id],id?{collection:name,id}:undefined);
export const createRental=(org:string,input:any,proformaId?:string):Promise<string>=>submitOperation('createRental',org,[input,proformaId]);
export const pay=(org:string,id:string,amount:number,method:string)=>submitOperation('pay',org,[id,amount,method]);
export const returnRental=(org:string,id:string,input:any)=>submitOperation('returnRental',org,[id,input]);
