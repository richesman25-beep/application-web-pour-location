import {createRequire} from 'node:module';
const require=createRequire(new URL('../functions/package.json',import.meta.url));
const {initializeApp}=require('firebase-admin/app');
const {getFirestore,FieldValue}=require('firebase-admin/firestore');
const {getAuth}=require('firebase-admin/auth');
const [uid,project]=process.argv.slice(2);
if(!uid||!/^[A-Za-z0-9_-]{1,128}$/.test(uid)||!project){console.error('Usage : node scripts/grant-superadmin.mjs UID PROJECT_ID');process.exit(1);}
const local=project.startsWith('demo-');
if(local&&(!process.env.FIRESTORE_EMULATOR_HOST||!process.env.FIREBASE_AUTH_EMULATOR_HOST)){console.error('Un projet démo exige les deux variables d’émulation.');process.exit(1);}
if(!local&&(process.env.FIRESTORE_EMULATOR_HOST||process.env.FIREBASE_AUTH_EMULATOR_HOST)){console.error('Ne mélangez pas le projet réel et les émulateurs.');process.exit(1);}
initializeApp({projectId:project});const db=getFirestore(),user=await getAuth().getUser(uid);
if(user.disabled)throw new Error('Le compte est désactivé. Réactivez-le avant la promotion.');
await db.runTransaction(async t=>{const existing=await t.get(db.collection('superAdmins').where('active','==',true).limit(1));if(!existing.empty)throw new Error('Un super-admin existe déjà. Utilisez la console du site pour accorder d’autres rôles.');t.set(db.doc(`superAdmins/${uid}`),{active:true,email:user.email||'',updatedAt:FieldValue.serverTimestamp(),updatedBy:'bootstrap'});t.create(db.collection('adminAudit').doc(),{actor:'bootstrap',action:'superadmin.bootstrap',target:uid,details:{},createdAt:FieldValue.serverTimestamp()});});
console.log('Premier super-administrateur enregistré. Reconnectez ce compte puis ouvrez /super-admin.');
