import {useEffect,useId,useRef,useState} from 'react';
import {Download} from 'lucide-react';
import {clearInstallPrompt,useInstallation} from '../services/pwaService';
export function InstallApp(){
 const {installed,prompt}=useInstallation(),[instructions,setInstructions]=useState(false),[busy,setBusy]=useState(false),dialog=useRef<HTMLDialogElement>(null),titleId=useId();
 useEffect(()=>{if(instructions&&!dialog.current?.open)dialog.current?.showModal();},[instructions]);
 if(installed)return null;
 async function install(){if(!prompt){setInstructions(true);return;}setBusy(true);try{await prompt.prompt();await prompt.userChoice;}catch{setInstructions(true);}finally{clearInstallPrompt();setBusy(false);}}
 return <><button type="button" className="install-app no-print" disabled={busy} onClick={()=>void install()}><Download size={17} aria-hidden="true"/>{busy?'Installation…':'Installer l’application'}</button><dialog ref={dialog} className="install-dialog" aria-labelledby={titleId} onClose={()=>setInstructions(false)}><h2 id={titleId}>Installer LOKASYON LAKAY</h2><p>Retrouvez l’application sur votre écran d’accueil, avec son icône et sa propre fenêtre.</p><div className="notice"><strong>Sur Android ou ordinateur</strong><p>Ouvrez ce site avec Chrome ou Edge. Dans le menu du navigateur, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».</p></div><div className="notice"><strong>Sur iPhone ou iPad</strong><p>Ouvrez ce site dans Safari, appuyez sur « Partager », puis « Sur l’écran d’accueil » et « Ajouter ». Activez « Ouvrir comme app » si cette option apparaît.</p></div><p>Une connexion Internet est nécessaire pour gérer vos locations et paiements.</p><button type="button" className="primary" onClick={()=>dialog.current?.close()}>Fermer les instructions d’installation</button></dialog></>;
}
