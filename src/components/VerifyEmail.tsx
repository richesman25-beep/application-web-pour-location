import {useState} from 'react';
import {sendEmailVerification} from 'firebase/auth';
import {auth} from '../firebase';
import {useApp} from '../contexts/AppContext';
import {authErrorMessage} from '../services/authErrors';
import {Brand} from './Brand';
export function VerifyEmail(){
 const {user,logout}=useApp();const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 async function act(check=false){setBusy(true);setError('');try{if(!auth.currentUser)return;if(check){await auth.currentUser.reload();await auth.currentUser.getIdToken(true);if(auth.currentUser.emailVerified){window.location.reload();return;}setMessage('Votre adresse n’est pas encore confirmée. Ouvrez le lien reçu par email, puis réessayez.');}else{auth.languageCode='fr';await sendEmailVerification(auth.currentUser);setMessage('Email de confirmation envoyé. Consultez votre boîte de réception et les courriers indésirables.');}}catch(e){setError(authErrorMessage(e));}finally{setBusy(false);}}
 return <main className="padded" style={{maxWidth:560,margin:'40px auto'}}><Brand/><h1>Confirmez votre adresse email</h1><p>Un email de confirmation est envoyé lors de l’inscription à <strong style={{overflowWrap:'anywhere'}}>{user?.email}</strong>. Cliquez sur son lien pour valider votre compte, puis revenez ici.</p><p>Vérifiez aussi les courriers indésirables. Si vous n’avez rien reçu, demandez un nouvel envoi.</p>{message&&<p role="status" className="notice">{message}</p>}{error&&<p role="alert" className="error">{error}</p>}<div className="button-group"><button className="primary" disabled={busy} onClick={()=>void act(true)}>J’ai confirmé mon email</button><button disabled={busy} onClick={()=>void act()}>Renvoyer l’email de confirmation</button><button disabled={busy} onClick={()=>void logout()}>Déconnexion</button></div></main>;
}
