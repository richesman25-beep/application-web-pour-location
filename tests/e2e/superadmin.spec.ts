import {test,expect} from '@playwright/test';
import {createRequire} from 'node:module';
const require=createRequire(new URL('../../functions/package.json',import.meta.url));
process.env.FIRESTORE_EMULATOR_HOST='127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST='127.0.0.1:9099';
const {initializeApp}=require('firebase-admin/app');
const {getFirestore}=require('firebase-admin/firestore');
const {getAuth}=require('firebase-admin/auth');
const app=initializeApp({projectId:'demo-lokasyon'},'superadmin-ui-test'),db=getFirestore(app),auth=getAuth(app);
test('console super-admin : accès protégé, entreprises, comptes, audit et maintenance',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const email=`super-ui-${Date.now()}@example.com`,password='Test123456!';const superUser=await auth.createUser({email,password});const ordinary=await auth.createUser({email:`ordinary-ui-${Date.now()}@example.com`,password});
 await db.doc('platform/settings').set({maintenance:false,registrationOpen:true,name:'Lokasyon',supportEmail:'support@example.com',message:''});
 await db.doc(`superAdmins/${superUser.uid}`).set({active:true,email});
 await db.doc(`organizations/${ordinary.uid}`).set({organizationId:ordinary.uid,name:'Entreprise UI test',status:'active'});
 await db.doc(`organizations/${ordinary.uid}/users/${ordinary.uid}`).set({organizationId:ordinary.uid,email:ordinary.email,role:'admin'});
 await page.goto('/login');await page.getByLabel('Email',{exact:false}).fill(email);await page.getByLabel('Mot de passe').fill(password);await page.getByRole('button',{name:'Se connecter',exact:true}).click();
 await expect(page).toHaveURL(/\/dashboard$/);await page.goto('/super-admin');await expect(page.getByRole('heading',{name:'Le pilotage de votre plateforme'})).toBeVisible();
 await page.getByRole('button',{name:'Entreprises',exact:true}).click();await page.getByLabel('Rechercher une entreprise').fill(ordinary.uid);const card=page.locator('article').filter({hasText:ordinary.uid});await card.getByRole('button',{name:'Gérer'}).click();await page.getByLabel('Accès à la plateforme').selectOption('suspended');await page.getByLabel('Motif de la modification').fill('Validation UI');await page.getByRole('button',{name:'Modifier le statut'}).click();await page.getByRole('dialog').getByRole('button',{name:'Confirmer',exact:true}).click();await expect(page.getByText('Action enregistrée.')).toBeVisible();expect((await db.doc(`organizations/${ordinary.uid}`).get()).data().status).toBe('suspended');
 await page.getByRole('button',{name:'Comptes',exact:true}).click();await page.getByLabel('Email',{exact:false}).fill(ordinary.email);await page.getByRole('button',{name:'Rechercher',exact:true}).click();await expect(page.getByRole('heading',{name:ordinary.email})).toBeVisible();
 await page.locator('article').filter({has:page.getByRole('heading',{name:ordinary.email,exact:true})}).getByRole('button',{name:'Réinitialiser le mot de passe'}).click();await page.getByRole('dialog').getByRole('button',{name:'Confirmer',exact:true}).click();await expect(page.getByLabel('Lien de réinitialisation')).toHaveValue(/oobCode=/);
 await page.getByRole('button',{name:'Journal des actions'}).click();await expect(page.getByText('account.reset-link',{exact:true}).first()).toBeVisible();
 await page.getByRole('button',{name:'Paramètres du site'}).click();await page.getByLabel('Mode maintenance').selectOption('true');await page.getByRole('button',{name:'Enregistrer',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Confirmer',exact:true}).click();await expect(page.getByText('Action enregistrée.')).toBeVisible();
 await page.reload();await expect(page.getByRole('heading',{name:'Le pilotage de votre plateforme'})).toBeVisible();
 for(const width of [360,390,768,1024,1440]){await page.setViewportSize({width,height:900});for(const label of ['Vue globale','Entreprises','Comptes','Paramètres du site','Super-administrateurs','Journal des actions']){await page.getByRole('button',{name:label,exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${label} à ${width}px`).toBe(true);}}
 await db.doc('platform/settings').set({maintenance:false,registrationOpen:true},{merge:true});await db.doc(`organizations/${ordinary.uid}`).update({status:'active'});
 await page.getByRole('button',{name:'Déconnexion',exact:true}).click();await page.goto('/login');await page.getByLabel('Email',{exact:false}).fill(ordinary.email);await page.getByLabel('Mot de passe').fill(password);await page.getByRole('button',{name:'Se connecter',exact:true}).click();await expect(page).toHaveURL(/\/dashboard$/);await page.goto('/super-admin');await expect(page.getByRole('heading',{name:'Accès réservé'})).toBeVisible();expect(errors).toEqual([]);
});
