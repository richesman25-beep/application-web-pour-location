import {test,expect} from '@playwright/test';

test('tableau de bord : petits écrans, navigation et raccourcis',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/login');
 await page.getByRole('button',{name:'Créer un compte administrateur'}).click();
 await page.getByLabel('Email',{exact:false}).fill(`dashboard-ui-${Date.now()}@example.com`);
 await page.getByLabel('Mot de passe').fill('Test123456!');
 await page.getByRole('button',{name:'Créer mon compte'}).click();
 await expect(page.getByRole('heading',{name:'Votre activité, en un coup d’œil.'})).toBeVisible();
 for(const width of [320,360,375,390,414,768,1024,1280,1440]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Débordement à ${width}px`).toBe(true);
  await expect(page.locator('.stat-card')).toHaveCount(4);
  const search=await page.locator('.global-search').boundingBox();
  expect(search!.x).toBeGreaterThanOrEqual(0);
  expect(search!.x+search!.width).toBeLessThanOrEqual(width);
  if(width<=1024){
   await expect(page.getByRole('navigation',{name:'Navigation mobile'}).locator('a,button')).toHaveCount(5);
   await expect(page.locator('.mobile-nav a.active')).toHaveText('Accueil');
   await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
   const lastPanel=await page.locator('.content>.panel').last().boundingBox();
   const floating=await page.locator('.floating').boundingBox();
   expect(lastPanel!.y+lastPanel!.height).toBeLessThan(floating!.y);
   await page.evaluate(()=>window.scrollTo(0,0));
  }
 }
 await page.setViewportSize({width:320,height:900});
 await page.getByRole('button',{name:'File d’attente',exact:true}).click();
 await expect(page.getByText('Aucune opération dans la file locale.')).toBeVisible();
 await page.getByRole('button',{name:'Masquer la file'}).click();
 for(const [name,path] of [['Nouveau client','/customers/new'],['Ajouter un bien','/assets/new'],['Enregistrer un paiement','/payments'],['Retour d’un bien','/returns']]){
  await page.locator('.quick-actions').getByRole('link',{name}).click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await page.goto('/dashboard');
 }
 await page.getByLabel('Recherche globale').fill('client test');
 await page.getByLabel('Recherche globale').press('Enter');
 await expect(page).toHaveURL(/\/search\?q=client%20test$/);
 await page.goto('/dashboard');
 await page.getByRole('button',{name:'Ouvrir le menu'}).click();
 await expect(page.locator('.sidebar')).toHaveClass(/open/);
 await page.getByRole('button',{name:'Fermer le menu'}).click({position:{x:300,y:100}});
 await page.locator('.floating').click();
 await expect(page).toHaveURL(/\/rentals\/new$/);
});
