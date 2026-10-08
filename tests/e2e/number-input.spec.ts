import {test,expect} from '@playwright/test';

test('saisie des montants : effacer zéro, décimales et tarifs automatiques',async({page})=>{
 await page.goto('/login');
 await page.getByRole('button',{name:'Créer un compte administrateur'}).click();
 await page.getByLabel('Email',{exact:false}).fill(`number-input-${Date.now()}@example.com`);
 await page.getByLabel('Mot de passe').fill('Test123456!');
 await page.getByRole('button',{name:'Créer mon compte'}).click();
 await expect(page.getByRole('heading',{name:'Votre activité, en un coup d’œil.'})).toBeVisible();
 await page.goto('/settings');
 await page.getByRole('button',{name:'Charger les données de démonstration'}).click();
 await expect(page.getByText('Données de démonstration enregistrées dans Firestore.')).toBeVisible();
 await page.goto('/rentals/new');
 for(const label of ['Tarif','Réduction','Frais','Caution totale (hors revenus)','Montant payé']){
  const input=page.getByLabel(label,{exact:true});
  await input.fill('');
  await expect(input).toHaveValue('');
  await input.pressSequentially('12');
  await expect(input).toHaveValue('12');
  await input.fill('');
  await input.pressSequentially('0.25');
  await input.blur();
  await expect(input).toHaveValue('0.25');
  await input.fill('0');
 }
 const rate=page.getByLabel('Tarif',{exact:true});
 await rate.focus();
 await rate.pressSequentially('12');
 await expect(rate).toHaveValue('12');
 await page.getByLabel('Bien *').selectOption({label:'Power Bank · 10 disponibles'});
 await expect(rate).toHaveValue('250');
 const quantity=page.getByLabel('Quantité',{exact:true});
 await quantity.fill('');await expect(quantity).toHaveValue('');
 await quantity.pressSequentially('2');await expect(quantity).toHaveValue('2');
 await expect(page.getByLabel('Caution totale (hors revenus)',{exact:true})).toHaveValue('0');
 await expect(page.locator('.price-summary')).toContainText('500 HTG');
 await rate.fill('0012');await rate.blur();await expect(rate).toHaveValue('12');
});
