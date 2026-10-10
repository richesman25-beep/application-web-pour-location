import {initializeApp} from 'firebase-admin/app';
import {getAuth} from 'firebase-admin/auth';
import {getFirestore,FieldValue} from 'firebase-admin/firestore';
import {onCall,HttpsError,type CallableRequest} from 'firebase-functions/v2/https';
import {validId,validText,validBoolean,validRole,assertManageable,canManage} from './adminPolicy';
initializeApp();
const db=getFirestore(),auth=getAuth();
const options={region:'us-central1',maxInstances:5};
async function requireSuperAdmin(request:CallableRequest){
 if(!request.auth)throw new HttpsError('unauthenticated','Connectez-vous pour continuer.');
 const [record,user,status]=await Promise.all([db.doc(`superAdmins/${request.auth.uid}`).get(),auth.getUser(request.auth.uid),db.doc(`accountStatus/${request.auth.uid}`).get()]);
 if(!user.emailVerified)throw new HttpsError('permission-denied','Confirmez votre adresse email.');
 if(!canManage(record.data(),user.disabled||status.data()?.disabled===true))throw new HttpsError('permission-denied','Accès réservé aux super-administrateurs actifs.');
 return request.auth.uid;
}
function badInput(error:unknown):never{throw new HttpsError('invalid-argument',error instanceof Error?error.message:'Données invalides.');}
function audit(actor:string,action:string,target:string,details:Record<string,unknown>={}){return {actor,action,target,details,createdAt:FieldValue.serverTimestamp()};}
export const adminListAccounts=onCall(options,async request=>{
 await requireSuperAdmin(request);const token=request.data?.pageToken;
 if(token!==undefined&&(typeof token!=='string'||token.length>4096))throw new HttpsError('invalid-argument','Pagination invalide.');
 const result=await auth.listUsers(50,token);
 return {accounts:result.users.map(u=>({uid:u.uid,email:u.email||'',name:u.displayName||'',disabled:u.disabled,emailVerified:u.emailVerified,createdAt:u.metadata.creationTime,lastLogin:u.metadata.lastSignInTime||''})),pageToken:result.pageToken||null};
});
export const adminFindAccount=onCall(options,async request=>{
 await requireSuperAdmin(request);let email:string;try{email=validText(request.data?.email,254);}catch(e){return badInput(e);}
 try{const u=await auth.getUserByEmail(email);return {uid:u.uid,email:u.email||'',name:u.displayName||'',disabled:u.disabled,emailVerified:u.emailVerified,createdAt:u.metadata.creationTime,lastLogin:u.metadata.lastSignInTime||''};}
 catch{throw new HttpsError('not-found','Aucun compte pour cet email.');}
});
export const adminSetAccountStatus=onCall(options,async request=>{
 const actor=await requireSuperAdmin(request);let uid:string,disabled:boolean,reason:string;
 try{uid=validId(request.data?.uid);disabled=validBoolean(request.data?.disabled);reason=validText(request.data?.reason,500);assertManageable(actor,uid,(await db.doc(`superAdmins/${uid}`).get()).data()?.active===true);}catch(e){return badInput(e);}
 // Access checks consult this document on every Firestore/Storage operation.
 // Disabling blocks data first; enabling restores Authentication first.
 await auth.getUser(uid);
 const policy=db.doc(`accountStatus/${uid}`);
 const event=db.collection('adminAudit').doc();await event.set({...audit(actor,disabled?'account.disable':'account.enable',uid,{reason}),outcome:'pending'});
 try{
  if(disabled){await policy.set({disabled:true,updatedAt:FieldValue.serverTimestamp(),updatedBy:actor});await auth.updateUser(uid,{disabled:true});await auth.revokeRefreshTokens(uid);}
  else{await auth.updateUser(uid,{disabled:false});await policy.set({disabled:false,updatedAt:FieldValue.serverTimestamp(),updatedBy:actor});}
  await event.update({outcome:'success'});return {ok:true};
 }catch{await event.update({outcome:'failed'});throw new HttpsError('internal','L’opération n’a pas été terminée. Consultez le statut du compte et réessayez.');}
});
export const adminPasswordReset=onCall(options,async request=>{
 const actor=await requireSuperAdmin(request);let uid:string;try{uid=validId(request.data?.uid);}catch(e){return badInput(e);}
 const user=await auth.getUser(uid);if(!user.email)throw new HttpsError('failed-precondition','Ce compte n’a pas d’email.');
 const link=await auth.generatePasswordResetLink(user.email);
 await db.collection('adminAudit').add(audit(actor,'account.reset-link',uid));return {link};
});
export const adminSetOrganization=onCall(options,async request=>{
 const actor=await requireSuperAdmin(request);let id:string,status:string,reason:string;
 try{id=validId(request.data?.id);status=validText(request.data?.status);reason=validText(request.data?.reason,500);if(!['active','suspended'].includes(status))throw new Error('Statut invalide.');}catch(e){return badInput(e);}
 await db.runTransaction(async t=>{const target=db.doc(`organizations/${id}`),s=await t.get(target);if(!s.exists)throw new HttpsError('not-found','Entreprise introuvable.');t.update(target,{status,statusReason:reason,updatedAt:FieldValue.serverTimestamp(),updatedBy:actor});t.create(db.collection('adminAudit').doc(),audit(actor,`organization.${status}`,id,{reason}));});return {ok:true};
});
export const adminSetMember=onCall(options,async request=>{
 const actor=await requireSuperAdmin(request);let org:string,uid:string,role:string,disabled:boolean;
 try{org=validId(request.data?.org);uid=validId(request.data?.uid);role=validRole(request.data?.role);disabled=validBoolean(request.data?.disabled);if(org===uid&&(disabled||role!=='admin'))throw new Error('Le propriétaire doit rester administrateur actif. Suspendez plutôt son entreprise.');}catch(e){return badInput(e);}
 const user=await auth.getUser(uid);
 await db.runTransaction(async t=>{if(!(await t.get(db.doc(`organizations/${org}`))).exists)throw new HttpsError('not-found','Entreprise introuvable.');t.set(db.doc(`organizations/${org}/users/${uid}`),{organizationId:org,email:user.email||'',role,disabled},{merge:true});t.create(db.collection('adminAudit').doc(),audit(actor,'member.update',`${org}/${uid}`,{role,disabled}));});return {ok:true};
});
export const adminSetSite=onCall(options,async request=>{
 const actor=await requireSuperAdmin(request);let values:Record<string,unknown>;
 try{values={name:validText(request.data?.name,100),supportEmail:validText(request.data?.supportEmail,254),maintenance:validBoolean(request.data?.maintenance),registrationOpen:validBoolean(request.data?.registrationOpen),message:typeof request.data?.message==='string'?request.data.message.slice(0,1000):''};if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(values.supportEmail)))throw new Error('Email de support invalide.');}catch(e){return badInput(e);}
 const batch=db.batch();batch.set(db.doc('platform/settings'),{...values,updatedAt:FieldValue.serverTimestamp(),updatedBy:actor},{merge:true});batch.create(db.collection('adminAudit').doc(),audit(actor,'site.settings','platform/settings',values));await batch.commit();return {ok:true};
});
export const adminSetSuperAdmin=onCall(options,async request=>{
 const actor=await requireSuperAdmin(request);let uid:string,active:boolean;
 try{uid=validId(request.data?.uid);active=validBoolean(request.data?.active);if(uid===actor)throw new Error('Vous ne pouvez pas modifier votre propre rôle super-admin.');}catch(e){return badInput(e);}
 const user=await auth.getUser(uid);if(user.disabled&&active)throw new HttpsError('failed-precondition','Réactivez le compte avant de lui accorder ce rôle.');
 await db.runTransaction(async t=>{const [current,status]=await Promise.all([t.get(db.doc(`superAdmins/${actor}`)),t.get(db.doc(`accountStatus/${uid}`))]);if(current.data()?.active!==true)throw new HttpsError('permission-denied','Votre rôle a été retiré.');if(active&&status.data()?.disabled===true)throw new HttpsError('failed-precondition','Ce compte est suspendu.');t.set(db.doc(`superAdmins/${uid}`),{active,email:user.email||'',updatedAt:FieldValue.serverTimestamp(),updatedBy:actor},{merge:true});t.create(db.collection('adminAudit').doc(),audit(actor,active?'superadmin.grant':'superadmin.revoke',uid));});return {ok:true};
});

export {accountingInitialize,accountingSaveAccount,accountingPost,accountingReverse,accountingSetPeriod,accountingSync} from './accounting';

export {businessOperation} from './business';
export {uploadPrivatePhoto,readPrivatePhoto} from './photos';
