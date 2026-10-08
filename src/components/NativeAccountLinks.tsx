import {Capacitor} from '@capacitor/core';

export function publicHttpsUrl(value:unknown){
 try{const url=new URL(String(value));return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}
}

export function NativeAccountLinks(){
 if(!Capacitor.isNativePlatform())return null;
 const privacy=publicHttpsUrl(import.meta.env.VITE_PRIVACY_POLICY_URL);
 const deletion=publicHttpsUrl(import.meta.env.VITE_ACCOUNT_DELETION_URL);
 if(!privacy&&!deletion)return null;
 return <nav className="native-account-links no-print" aria-label="Confidentialité et compte">
  {privacy&&<a href={privacy} target="_blank" rel="noopener noreferrer">Confidentialité</a>}
  {deletion&&<a href={deletion} target="_blank" rel="noopener noreferrer">Demander la suppression de mon compte</a>}
 </nav>;
}
