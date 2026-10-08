import {Capacitor} from '@capacitor/core';
import {Network} from '@capacitor/network';
import {useSyncExternalStore} from 'react';
// navigator.onLine can be true on Wi-Fi without Internet and after an offline PWA restart.
let online=navigator.onLine&&(window as Window&{__LOKASYON_OFFLINE__?:boolean}).__LOKASYON_OFFLINE__!==true;
const listeners=new Set<()=>void>();export const networkOnline=()=>online;
function update(value:boolean){if(online!==value){online=value;listeners.forEach(fn=>fn());}}
export const useNetwork=()=>useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},networkOnline);
let probing=false;
async function probe(){if(probing)return;if(!navigator.onLine){update(false);return;}probing=true;try{const native=Capacitor.isNativePlatform();if(native&&!(await Network.getStatus()).connected){update(false);return;}const response=await fetch(native?'https://lokasyonlakay.netlify.app/manifest.webmanifest?network-check=1':'/manifest.webmanifest?network-check=1',{mode:native?'no-cors':'same-origin',cache:'no-store',signal:AbortSignal.timeout(3000)});if(native){update(response.ok||response.type==='opaque');return;}const manifest=await response.json();update(response.ok&&manifest.name==='LOKASYON LAKAY');}catch{update(false);}finally{probing=false;}}
window.addEventListener('offline',()=>update(false));window.addEventListener('online',()=>void probe());setInterval(()=>void probe(),10000);void probe();

if(Capacitor.isNativePlatform())void Network.addListener('networkStatusChange',status=>{if(!status.connected)update(false);else void probe();});
