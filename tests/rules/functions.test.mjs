import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../functions/package.json',import.meta.url));
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';
const {initializeApp}=require('firebase-admin/app');const {getAuth}=require('firebase-admin/auth');const {getFirestore}=require('firebase-admin/firestore');
initializeApp({projectId:'demo-lokasyon'});const auth=getAuth(),db=getFirestore();
async function account(label){const email=`${label}-${Date.now()}@example.com`,u=await auth.createUser({email,password:'Test123456!'});const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password:'Test123456!',returnSecureToken:true})});const body=await response.json();assert(body.idToken);return {...u,token:body.idToken};}
async function call(name,token,data={}){const response=await fetch(`http://127.0.0.1:5001/demo-lokasyon/us-central1/${name}`,{method:'POST',headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify({data})});return {status:response.status,body:await response.json()};}
test('les fonctions vérifient le rôle serveur, gèrent la plateforme et empêchent les élévations abusives',async()=>{
 const admin=await account('super'),owner=await account('owner'),target=await account('target');
 const denied=await call('adminListAccounts',owner.token);assert.equal(denied.body.error.status,'PERMISSION_DENIED');const anonymous=await call('adminListAccounts',null);assert.equal(anonymous.body.error.status,'UNAUTHENTICATED');
 await db.doc(`superAdmins/${admin.uid}`).set({active:true,email:admin.email});await db.doc(`organizations/${owner.uid}`).set({organizationId:owner.uid,name:'Test',status:'active'});
 const listing=await call('adminListAccounts',admin.token);assert.equal(listing.status,200);assert(listing.body.result.accounts.some(a=>a.uid===owner.uid));
 let response=await call('adminSetOrganization',admin.token,{id:owner.uid,status:'suspended',reason:'Test de suspension'});assert.equal(response.status,200);assert.equal((await db.doc(`organizations/${owner.uid}`).get()).data().status,'suspended');
 response=await call('adminSetOrganization',admin.token,{id:owner.uid,status:'active',reason:'Test de réactivation'});assert.equal(response.status,200);
 response=await call('adminSetAccountStatus',admin.token,{uid:admin.uid,disabled:true,reason:'Auto suspension'});assert.equal(response.body.error.status,'INVALID_ARGUMENT');
 response=await call('adminSetAccountStatus',admin.token,{uid:target.uid,disabled:true,reason:'Test'});assert.equal(response.status,200);assert.equal((await auth.getUser(target.uid)).disabled,true);assert.equal((await db.doc(`accountStatus/${target.uid}`).get()).data().disabled,true);
 response=await call('adminSetAccountStatus',admin.token,{uid:target.uid,disabled:false,reason:'Retour'});assert.equal(response.status,200);
 response=await call('adminSetMember',admin.token,{org:owner.uid,uid:target.uid,role:'employee',disabled:false});assert.equal(response.status,200);
 response=await call('adminSetMember',admin.token,{org:owner.uid,uid:owner.uid,role:'employee',disabled:false});assert.equal(response.body.error.status,'INVALID_ARGUMENT');
 response=await call('adminSetSuperAdmin',admin.token,{uid:target.uid,active:true});assert.equal(response.status,200);
 response=await call('adminSetAccountStatus',admin.token,{uid:target.uid,disabled:true,reason:'Test'});assert.equal(response.body.error.status,'INVALID_ARGUMENT');
 response=await call('adminSetSuperAdmin',admin.token,{uid:admin.uid,active:false});assert.equal(response.body.error.status,'INVALID_ARGUMENT');
 response=await call('adminSetSuperAdmin',admin.token,{uid:target.uid,active:false});assert.equal(response.status,200);
 response=await call('adminSetSite',admin.token,{name:'Lokasyon',supportEmail:'support@example.com',maintenance:true,registrationOpen:false,message:'Test maintenance'});assert.equal(response.status,200);assert.equal((await db.doc('platform/settings').get()).data().maintenance,true);
 response=await call('adminPasswordReset',admin.token,{uid:owner.uid});assert.equal(response.status,200);assert(response.body.result.link.includes('oobCode='));
 await db.doc('platform/settings').set({maintenance:false,registrationOpen:true},{merge:true});assert((await db.collection('adminAudit').get()).size>=8);
 await db.doc(`superAdmins/${admin.uid}`).set({active:false},{merge:true});response=await call('adminListAccounts',admin.token);assert.equal(response.body.error.status,'PERMISSION_DENIED');
});
