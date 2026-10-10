import {NativeAccountLinks} from '../components/NativeAccountLinks';
import {InstallApp} from '../components/InstallApp';
import {DownloadApk} from '../components/DownloadApk';
import {Brand} from '../components/Brand';
import {useApp} from '../contexts/AppContext';
import {useState} from 'react';
import {signInWithEmailAndPassword,createUserWithEmailAndPassword,sendEmailVerification,sendPasswordResetEmail} from 'firebase/auth';
import {auth,emulator} from '../firebase';
import {authErrorMessage} from '../services/authErrors';
import {Form} from '../components/Form';
import {ArrowUpRight,Car,House,Package,KeyRound,Check,MapPin} from 'lucide-react';
import './Login.css';

export function Login(){
 const [register,setRegister]=useState(false),[reset,setReset]=useState(false),[resetSent,setResetSent]=useState(false);
 const {site}=useApp();
 return <main className="login auth-page">
  <section className="login-story auth-showcase" aria-label="Bienvenue sur LOKASYON LAKAY">
   <div className="auth-brand-row"><div className="brand"><Brand/></div><span className="auth-location"><MapPin size={13}/> Pensé pour Haïti</span></div>
   <div className="auth-story-copy"><p className="auth-eyebrow"><span/> MOINS DE GESTION, PLUS DE POSSIBILITÉS</p><h1>Vos locations.<br/><span>L’esprit tranquille.</span></h1><p>Un client, un bien, une nouvelle possibilité.<br/>Gérez chaque location et faites grandir votre activité.</p></div>
   <div className="auth-photo-frame">
    <img src="/images/location-accueil.webp" alt="Une entrepreneuse utilise un ordinateur pour gérer une location et remet les clés à son client." width="1440" height="1080" fetchPriority="high"/>
    <div className="auth-photo-note" aria-hidden="true"><span className="auth-check"><Check size={17}/></span><div><strong>De la réservation au retour</strong><small>Tout se retrouve au même endroit.</small></div><ArrowUpRight size={18}/></div>
    <span className="auth-photo-caption">Votre activité. Vos clients. Votre réussite.</span>
   </div>
   <div className="auth-categories" aria-label="Pour tous vos biens"><span><Car size={16}/> Véhicules</span><span><House size={16}/> Immobilier</span><span><Package size={16}/> Équipements</span></div>
  </section>
  <section className="auth-entry">
   <div className="login-form auth-card">
    <div className="auth-welcome-icon" aria-hidden="true"><KeyRound size={25}/></div>
    <p className="auth-form-eyebrow">{register?'UN NOUVEAU DÉPART':'VOTRE ESPACE VOUS ATTEND'}</p>
    <h2>{reset?'Réinitialiser votre mot de passe':register?'Créer votre entreprise':'Heureux de vous retrouver'}</h2>
    <p className="auth-form-description">{emulator?'Environnement de test Firebase local. Utilisez un email et un mot de passe de test.':register?'Créez votre compte avec votre email et un mot de passe. Votre organisation sera créée automatiquement.':'Connectez-vous avec votre email et votre mot de passe.'}</p>
    {site.maintenance&&<p className="notice" role="status">Le site est temporairement en maintenance. La console super-admin reste accessible.</p>}{site.message&&<p className="notice">{site.message}</p>}
    {reset?<><p>Indiquez l’adresse email de votre compte pour recevoir un lien de récupération.</p><Form fields={[{name:'email',label:'Email',type:'email',required:true}]} label="Envoyer le lien de récupération" onSubmit={async v=>{try{auth.languageCode='fr';await sendPasswordResetEmail(auth,v.email.trim());setResetSent(true);}catch(e){if((e as {code?:string}).code==='auth/user-not-found'){setResetSent(true);return;}throw new Error(authErrorMessage(e));}}}/>{resetSent&&<p className="notice" role="status">Si un compte correspond à cette adresse, un email de récupération vous sera envoyé. Vérifiez aussi les courriers indésirables.</p>}<button className="link" onClick={()=>{setReset(false);setResetSent(false);}}>Retour à la connexion</button></>:register&&(!site.registrationOpen||site.maintenance)?<p className="notice">La création de nouvelles entreprises est temporairement fermée.</p>:<Form fields={[{name:'email',label:'Email',type:'email',required:true},...(!register?[{name:'organization',label:'Identifiant de l’organisation (collaborateur uniquement)'}]:[]),{name:'password',label:'Mot de passe (6 caractères minimum)',type:'password',required:true}]} label={register?'Créer mon compte':'Se connecter'} onSubmit={async v=>{if(v.password.length<6)throw new Error('Le mot de passe doit contenir au moins 6 caractères.');try{if(!register&&v.organization)sessionStorage.setItem('organizationId',v.organization.trim());else sessionStorage.removeItem('organizationId');auth.languageCode='fr';if(register){const credential=await createUserWithEmailAndPassword(auth,v.email.trim(),v.password);try{await sendEmailVerification(credential.user);}catch{ /* Le compte existe : l’écran de validation propose un nouvel envoi. */ }}else await signInWithEmailAndPassword(auth,v.email.trim(),v.password);}catch(error){throw new Error(authErrorMessage(error));}}}/>}
    {!register&&!reset&&<button className="link" onClick={()=>{setReset(true);setResetSent(false);}}>Mot de passe oublié ?</button>}
    {!reset&&<div className="auth-switch"><span>{register?'Vous avez déjà votre espace ?':'Une nouvelle entreprise à gérer ?'}</span><button className="link" onClick={()=>setRegister(!register)}>{register?'J’ai déjà un compte':'Créer un compte administrateur'}<ArrowUpRight size={15} aria-hidden="true"/></button></div>}
   </div>
   <p className="auth-footer">Simple à utiliser. Pensé pour votre quotidien.<span>HTG & USD · Ordinateur & mobile</span></p>
   <InstallApp/>
   <DownloadApk/>
   <NativeAccountLinks/>
  </section>
 </main>;
}
