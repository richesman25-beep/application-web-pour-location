import {randomUUID} from 'node:crypto';
import {getFirestore} from 'firebase-admin/firestore';
import {getStorage} from 'firebase-admin/storage';
import {getApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {onCall,HttpsError,type CallableRequest} from 'firebase-functions/v2/https';
import sharp from 'sharp';
import {authorizeBusiness} from './business';
import {privatePhotoPath} from './businessPolicy';
import {validId} from './adminPolicy';
async function access(request:CallableRequest,read=false){if(!request.auth)throw new HttpsError('unauthenticated','Connectez-vous.');const org=validId(request.data?.org);if((await getAuth().getUser(request.auth.uid)).disabled)throw new HttpsError('permission-denied','Compte suspendu.');if(read){const [role,status]=await getFirestore().getAll(getFirestore().doc(`superAdmins/${request.auth.uid}`),getFirestore().doc(`accountStatus/${request.auth.uid}`));if(role.data()?.active===true&&status.data()?.disabled!==true)return org;}await getFirestore().runTransaction(t=>authorizeBusiness(t,org,request.auth!.uid));return org;}
const bucket=()=>getStorage().bucket(getApp().options.storageBucket||`${getApp().options.projectId}.appspot.com`);
function rasterSignature(input:Buffer){if(input.length<12)return false;return input[0]===255&&input[1]===216&&input[2]===255||input.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))||input.toString('ascii',0,4)==='RIFF'&&input.toString('ascii',8,12)==='WEBP';}
const options={region:'us-central1',maxInstances:5,memory:'512MiB' as const,timeoutSeconds:60};
export const uploadPrivatePhoto=onCall(options,async request=>{
 try{const org=await access(request),data=request.data?.data;if(typeof data!=='string'||data.length>7*1024*1024||!/^[A-Za-z0-9+/]+={0,2}$/.test(data))throw new Error('Image invalide ou trop volumineuse.');const input=Buffer.from(data,'base64');if(input.length>=5*1024*1024||!rasterSignature(input))throw new Error('Image trop volumineuse.');
  const metadata=await sharp(input,{limitInputPixels:20000000}).metadata();if(!['jpeg','png','webp'].includes(metadata.format||''))throw new Error('Format d’image refusé.');
  const image=await sharp(input,{limitInputPixels:20000000}).rotate().resize(1200,1200,{fit:'inside',withoutEnlargement:true}).jpeg({quality:80}).toBuffer();
  const path=`organizations/${org}/private/${randomUUID()}.jpg`;await bucket().file(path).save(image,{resumable:false,metadata:{contentType:'image/jpeg',cacheControl:'private, no-store'}});return path;
 }catch(e){if(e instanceof HttpsError)throw e;throw new HttpsError('invalid-argument','Image invalide. Choisissez une image JPEG, PNG ou WebP de moins de 5 Mo.');}
});
export const readPrivatePhoto=onCall(options,async request=>{
 try{const org=await access(request,true),path=privatePhotoPath(request.data?.path,org);if(!path)throw new Error('Photo invalide.');const file=bucket().file(path),[metadata]=await file.getMetadata();if(Number(metadata.size)>5*1024*1024)throw new Error('Photo trop volumineuse.');const [content]=await file.download();if(content.length>=5*1024*1024||!rasterSignature(content))throw new Error('Format de photo refusé.');
  // Old objects are decoded too: never return arbitrary active content to the WebView.
  const image=await sharp(content,{limitInputPixels:20000000}).rotate().resize(1200,1200,{fit:'inside',withoutEnlargement:true}).jpeg({quality:80}).toBuffer();return {data:image.toString('base64'),contentType:'image/jpeg'};
 }catch(e){if(e instanceof HttpsError)throw e;throw new HttpsError('not-found','Photo indisponible.');}
});
