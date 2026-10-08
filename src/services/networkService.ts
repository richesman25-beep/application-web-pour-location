import {useSyncExternalStore} from 'react';
// navigator.onLine can be true on Wi-Fi without Internet and after an offline PWA restart.
let online=navigator.onLine&&(window as Window&{__LOKASYON_OFFLINE__?:boolean}).__LOKASYON_OFFLINE__!==true;
const listeners=new Set<()=>void>();export const networkOnline=()=>online;
function update(value:boolean){if(online!==value){online=value;listeners.forEach(fn=>fn());}}
export const useNetwork=()=>useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},networkOnline);
let probing=false;
async function probe(){if(probing)return;if(!navigator.onLine){update(false);return;}probing=true;try{const response=await fetch('/manifest.webmanifest?network-check=1',{cache:'no-store',signal:AbortSignal.timeout(3000)});const manifest=await response.json();update(response.ok&&manifest.name==='LOKASYON LAKAY');}catch{update(false);}finally{probing=false;}}
window.addEventListener('offline',()=>update(false));window.addEventListener('online',()=>void probe());setInterval(()=>void probe(),10000);void probe();
