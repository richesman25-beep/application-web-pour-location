import {httpsCallable} from 'firebase/functions';
import {auth,functions} from '../firebase';
import {photoPath} from './photoPolicy';
export async function photoDataUrl(value:string,org:string){
 if(!value)return '';if(value.startsWith('/images/'))return value;
 const uid=auth.currentUser?.uid,path=photoPath(value,org);if(!uid||!path)throw new Error('Photo indisponible.');
 const {data}=await httpsCallable<any,{data:string;contentType:string}>(functions,'readPrivatePhoto')({org,path});if(auth.currentUser?.uid!==uid)throw new Error('Compte modifié.');if(data.contentType!=='image/jpeg')throw new Error('Format refusé.');return `data:image/jpeg;base64,${data.data}`;
}
