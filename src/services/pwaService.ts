import {Capacitor} from '@capacitor/core';
import {useSyncExternalStore} from 'react';
export type InstallPrompt=Event&{prompt:()=>Promise<void>;userChoice:Promise<{outcome:'accepted'|'dismissed'}>};
const display=window.matchMedia('(display-mode: standalone)');
const isInstalled=()=>Capacitor.isNativePlatform()||display.matches||(navigator as Navigator&{standalone?:boolean}).standalone===true;
let state:{installed:boolean;prompt:InstallPrompt|null}={installed:isInstalled(),prompt:null};
const subscribers=new Set<()=>void>();
function update(next:typeof state){state=next;subscribers.forEach(listener=>listener());}
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();update({...state,prompt:event as InstallPrompt});});
window.addEventListener('appinstalled',()=>update({installed:true,prompt:null}));
display.addEventListener('change',()=>update({...state,installed:isInstalled()}));
export function useInstallation(){return useSyncExternalStore(listener=>{subscribers.add(listener);return()=>{subscribers.delete(listener);};},()=>state);}
export function clearInstallPrompt(){update({...state,prompt:null});}
export function registerServiceWorker(){
 if(Capacitor.isNativePlatform())return;
 if((!import.meta.env.PROD&&import.meta.env.MODE!=='offline-test')||!('serviceWorker' in navigator))return;
 const register=()=>{void navigator.serviceWorker.register('/sw.js',{scope:'/',updateViaCache:'none'}).catch(()=>{/* Installation remains available through the browser menu. */});};
 if(document.readyState==='complete')register();else window.addEventListener('load',register,{once:true});
}
