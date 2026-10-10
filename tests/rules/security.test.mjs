import {test,before,after,beforeEach} from 'node:test';
import {readFileSync} from 'node:fs';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,updateDoc,deleteDoc,writeBatch} from 'firebase/firestore';
import {ref,uploadBytes,getBytes} from 'firebase/storage';
let env;
before(async()=>{env=await initializeTestEnvironment({projectId:'demo-lokasyon',firestore:{host:'127.0.0.1',port:8080,rules:readFileSync('firestore.rules','utf8')},storage:{host:'127.0.0.1',port:9199,rules:readFileSync('storage.rules','utf8')}});});
after(async()=>{await env?.cleanup();});
beforeEach(async()=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const db=c.firestore();await Promise.all([
 setDoc(doc(db,'organizations','owner'),{organizationId:'owner',name:'Entreprise',status:'active'}),
 setDoc(doc(db,'organizations','owner','users','owner'),{organizationId:'owner',role:'admin',email:'owner@example.com'}),
 setDoc(doc(db,'organizations','owner','users','employee'),{organizationId:'owner',role:'employee',email:'employee@example.com'}),
 setDoc(doc(db,'organizations','owner','customers','CLI-1'),{organizationId:'owner',firstName:'Jean'}),
 setDoc(doc(db,'organizations','other'),{organizationId:'other',name:'Autre',status:'active'}),
 setDoc(doc(db,'superAdmins','super'),{active:true,email:'super@example.com'}),
 setDoc(doc(db,'adminAudit','event'),{actor:'super',action:'test',target:'owner'}),
 ]);});});
test('un administrateur d’entreprise ne peut pas se promouvoir ni administrer la plateforme',async()=>{const db=env.authenticatedContext('owner',{email_verified:true}).firestore();await assertFails(setDoc(doc(db,'superAdmins','owner'),{active:true}));await assertFails(setDoc(doc(db,'platform','settings'),{maintenance:true}));await assertFails(setDoc(doc(db,'adminAudit','forged'),{actor:'owner'}));await assertFails(getDocs(collection(db,'organizations')));await assertFails(getDoc(doc(db,'organizations','other')));});
test('le propriétaire ne peut pas contourner la suspension par une modification de son entreprise',async()=>{const db=env.authenticatedContext('owner',{email_verified:true}).firestore();await assertSucceeds(updateDoc(doc(db,'organizations','owner'),{name:'Nouveau nom'}));await assertFails(updateDoc(doc(db,'organizations','owner'),{status:'suspended'}));await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'organizations','owner'),{status:'suspended'}));await assertFails(updateDoc(doc(db,'organizations','owner'),{status:'active'}));await assertFails(getDoc(doc(db,'organizations','owner','customers','CLI-1')));});
test('un employé lit les données métier sans accéder aux fonctions administratives',async()=>{const db=env.authenticatedContext('employee',{email_verified:true}).firestore();await assertSucceeds(getDoc(doc(db,'organizations','owner','customers','CLI-1')));await assertFails(setDoc(doc(db,'organizations','owner','settings','company'),{organizationId:'owner',name:'Intrusion'}));await assertFails(getDoc(doc(db,'adminAudit','event')));});
test('la suspension d’un membre bloque son accès à l’entreprise',async()=>{const db=env.authenticatedContext('employee',{email_verified:true}).firestore();await assertSucceeds(getDoc(doc(db,'organizations','owner','customers','CLI-1')));await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'organizations','owner','users','employee'),{disabled:true}));await assertFails(getDoc(doc(db,'organizations','owner','customers','CLI-1')));});
test('la suspension d’un compte bloque les jetons déjà ouverts',async()=>{const db=env.authenticatedContext('owner',{email_verified:true}).firestore();await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'accountStatus','owner'),{disabled:true}));await assertFails(getDoc(doc(db,'organizations','owner','customers','CLI-1')));await assertFails(setDoc(doc(db,'accountStatus','owner'),{disabled:false}));});
test('la maintenance bloque les comptes ordinaires tout en préservant le contrôle global',async()=>{await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'platform','settings'),{maintenance:true}));await assertFails(getDoc(doc(env.authenticatedContext('owner',{email_verified:true}).firestore(),'organizations','owner','customers','CLI-1')));await assertSucceeds(getDoc(doc(env.authenticatedContext('super',{email_verified:true}).firestore(),'organizations','owner','customers','CLI-1')));});
test('la fermeture des inscriptions interdit la création d’une entreprise par SDK direct',async()=>{await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'platform','settings'),{registrationOpen:false}));await assertFails(setDoc(doc(env.authenticatedContext('new',{email_verified:true}).firestore(),'organizations','new'),{organizationId:'new',name:'Interdit',status:'active'}));});
test('un super-admin peut lire toutes les entreprises et les audits, mais les écritures globales passent par le serveur',async()=>{const db=env.authenticatedContext('super',{email_verified:true}).firestore();await assertSucceeds(getDocs(collection(db,'organizations')));await assertSucceeds(getDoc(doc(db,'adminAudit','event')));await assertFails(setDoc(doc(db,'superAdmins','another'),{active:true}));await assertFails(updateDoc(doc(db,'organizations','owner'),{status:'suspended'}));});
test('les membres ne peuvent pas obtenir un rôle global et le propriétaire ne peut pas être rétrogradé',async()=>{const db=env.authenticatedContext('owner',{email_verified:true}).firestore();await assertSucceeds(setDoc(doc(db,'organizations','owner','users','new-member'),{organizationId:'owner',role:'employee',email:'new@example.com'}));await assertFails(setDoc(doc(db,'organizations','owner','users','attacker'),{organizationId:'owner',role:'superadmin',email:'bad@example.com'}));await assertFails(updateDoc(doc(db,'organizations','owner','users','owner'),{role:'employee'}));});
test('Storage refuse les écritures directes et applique les suspensions aux lectures',async()=>{
 const storage=env.authenticatedContext('owner',{email_verified:true}).storage(),photo=ref(storage,'organizations/owner/test.png');
 await assertFails(uploadBytes(photo,new Uint8Array([1,2,3]),{contentType:'image/png'}));
 await env.withSecurityRulesDisabled(c=>uploadBytes(ref(c.storage(),'organizations/owner/test.png'),new Uint8Array([1,2,3]),{contentType:'image/png'}));
 await assertFails(getBytes(photo));await env.withSecurityRulesDisabled(c=>updateDoc(doc(c.firestore(),'organizations','owner'),{status:'suspended'}));await assertFails(getBytes(photo));await assertFails(getBytes(ref(env.authenticatedContext('super',{email_verified:true}).storage(),'organizations/owner/test.png')));
});
test('aucune mutation métier ni reçu ne peut être falsifié par le SDK client, même par un admin',async()=>{
 for(const name of ['customers','assets','rentals','payments','invoices','counters','proformas','settings','categories','businessAudit','offlineOperations']){
  await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'organizations','owner',name,'existing'),{organizationId:'owner',createdBy:'owner'}));
  for(const uid of ['owner','employee','super']){const db=env.authenticatedContext(uid,{email_verified:true}).firestore();await assertFails(setDoc(doc(db,'organizations','owner',name,'new'),{organizationId:'owner',createdBy:uid}));await assertFails(updateDoc(doc(db,'organizations','owner',name,'existing'),{total:1,paid:1,balance:0}));await assertFails(deleteDoc(doc(db,'organizations','owner',name,'existing')));}
 }
});
test('la comptabilité est réservée aux admins et ses écritures passent uniquement par le serveur',async()=>{
 await env.withSecurityRulesDisabled(async c=>{for(const name of ['accountingAccounts','accountingEntries','accountingPeriods','accountingAudit','accountingSources'])await setDoc(doc(c.firestore(),'organizations','owner',name,'test'),{organizationId:'owner',date:'2026-10-06'});});
 const owner=env.authenticatedContext('owner',{email_verified:true}).firestore(),employee=env.authenticatedContext('employee',{email_verified:true}).firestore();
 for(const name of ['accountingAccounts','accountingEntries','accountingPeriods','accountingAudit','accountingSources']){const target=doc(owner,'organizations','owner',name,'test');await assertSucceeds(getDoc(target));await assertFails(getDoc(doc(employee,'organizations','owner',name,'test')));await assertFails(getDoc(doc(env.authenticatedContext('other',{email_verified:true}).firestore(),'organizations','owner',name,'test')));await assertFails(setDoc(target,{organizationId:'owner'}));await assertFails(deleteDoc(target));}
 await assertFails(setDoc(doc(owner,'organizations','owner','counters','accountingJournal'),{organizationId:'owner',value:999}));await assertSucceeds(getDoc(doc(env.authenticatedContext('super',{email_verified:true}).firestore(),'organizations','owner','accountingEntries','test')));
});
test('les reçus de synchronisation sont personnels, immuables et soumis aux suspensions',async()=>{
 const db=env.authenticatedContext('owner',{email_verified:true}).firestore(),target=doc(db,'organizations','owner','offlineOperations','unique');const receipt={organizationId:'owner',createdBy:'owner',createdAt:'2026-10-07',kind:'pay',result:null};
 await assertSucceeds(getDoc(target));await assertFails(setDoc(target,{...receipt,createdBy:'employee'}));await assertFails(setDoc(target,receipt));await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'organizations','owner','offlineOperations','unique'),receipt));await assertFails(updateDoc(target,{result:'changed'}));await assertFails(deleteDoc(target));await assertFails(getDoc(doc(env.authenticatedContext('employee',{email_verified:true}).firestore(),'organizations','owner','offlineOperations','unique')));await assertFails(getDoc(doc(env.authenticatedContext('other',{email_verified:true}).firestore(),'organizations','owner','offlineOperations','unique')));await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'accountStatus','owner'),{disabled:true}));await assertFails(setDoc(doc(db,'organizations','owner','offlineOperations','suspended'),receipt));
});

test('audit : les paiements invalides et les modifications rétroactives sont refusés',async()=>{
 const db=env.authenticatedContext('employee',{email_verified:true}).firestore(),target=doc(db,'organizations','owner','payments','PAY-audit');
 await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'organizations','owner','rentals','LOC-audit'),{organizationId:'owner',currency:'HTG',total:100,paid:0,balance:100}));
 const payment={organizationId:'owner',rentalId:'LOC-audit',amount:12,currency:'HTG',method:'Cash HTG',date:'2026-10-09T12:00:00.000Z'};
 await assertFails(setDoc(target,{...payment,amount:-12}));
 await assertFails(setDoc(target,{...payment,amount:0}));
 await assertFails(setDoc(target,{...payment,amount:100.001}));
 await assertFails(setDoc(target,{...payment,currency:'USD'}));
 await assertFails(setDoc(target,{...payment,rentalId:'missing'}));
 await assertFails(setDoc(target,payment));await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'organizations','owner','payments','PAY-audit'),payment));
 await assertFails(updateDoc(target,{amount:99}));
 await assertFails(deleteDoc(doc(env.authenticatedContext('owner',{email_verified:true}).firestore(),'organizations','owner','payments','PAY-audit')));
});
test('audit : Storage refuse les images actives SVG et les fichiers trop volumineux',async()=>{
 const storage=env.authenticatedContext('employee',{email_verified:true}).storage();
 await assertFails(uploadBytes(ref(storage,'organizations/owner/audit.svg'),new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'),{contentType:'image/svg+xml'}));
 await assertFails(uploadBytes(ref(storage,'organizations/owner/audit-large.jpg'),new Uint8Array(5*1024*1024),{contentType:'image/jpeg'}));
 await assertFails(uploadBytes(ref(storage,'organizations/owner/audit.jpg'),new Uint8Array([1,2,3]),{contentType:'image/jpeg'}));
 await assertFails(getBytes(ref(env.unauthenticatedContext().storage(),'organizations/owner/audit.jpg')));
 await assertFails(getBytes(ref(env.authenticatedContext('other',{email_verified:true}).storage(),'organizations/owner/audit.jpg')));
});
test('audit : les locations refusent les montants négatifs, fractions de centime et totaux incohérents',async()=>{
 const db=env.authenticatedContext('employee',{email_verified:true}).firestore(),target=doc(db,'organizations','owner','rentals','LOC-money');
 const rental={organizationId:'owner',quantity:1,currency:'HTG',rentalTotal:90,deposit:10,total:100,paid:12,balance:88};
 await assertFails(setDoc(target,rental));await env.withSecurityRulesDisabled(c=>setDoc(doc(c.firestore(),'organizations','owner','rentals','LOC-money'),rental));
 for(const patch of [{total:-100},{paid:101,balance:-1},{balance:99},{rentalTotal:99},{paid:12.001,balance:87.999},{currency:'EUR'},{quantity:1.5}])await assertFails(updateDoc(target,patch));
 await assertFails(updateDoc(target,{paid:20,balance:80}));
});

test('un email non confirmé ne peut ni lire les données ni créer une entreprise',async()=>{const db=env.authenticatedContext('owner',{email_verified:false}).firestore();await assertFails(getDoc(doc(db,'organizations','owner','customers','CLI-1')));await assertFails(setDoc(doc(env.authenticatedContext('unverified',{email_verified:false}).firestore(),'organizations','unverified'),{organizationId:'unverified',name:'Interdit',status:'active'}));await assertSucceeds(getDoc(doc(db,'platform','settings')));});
