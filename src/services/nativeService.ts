import {Capacitor,registerPlugin} from '@capacitor/core';
import {Filesystem,Directory} from '@capacitor/filesystem';
import {Share} from '@capacitor/share';
export async function exportFile(filename:string,blob:Blob){
 if(!Capacitor.isNativePlatform()){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);return;}
 const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(new Error('Impossible de préparer le fichier.'));reader.readAsDataURL(blob);});
 const result=await Filesystem.writeFile({path:'exports/'+filename.replace(/[^a-zA-Z0-9._-]/g,'_'),data,directory:Directory.Cache,recursive:true});
 await Share.share({title:filename,url:result.uri,dialogTitle:'Enregistrer ou partager le document'});
}
export function initializeNative(){if(!Capacitor.isNativePlatform())return;const print=registerPlugin<{print:()=>Promise<void>}>('AppPrint');window.print=()=>{void print.print().catch(()=>window.alert('Impossible d’ouvrir l’impression Android.'));};}
