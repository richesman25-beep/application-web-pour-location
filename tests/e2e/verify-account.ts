import {expect,type Page} from '@playwright/test';
/** Confirme uniquement une adresse via les codes de l’émulateur local. */
export async function verifyAccount(page:Page){
 await expect(page.getByRole('heading',{name:'Confirmez votre adresse email'})).toBeVisible();
 const email=(await page.locator('main strong').innerText()).trim();
 let code='';await expect.poll(async()=>{const r=await fetch('http://127.0.0.1:9099/emulator/v1/projects/demo-lokasyon/oobCodes');const data=await r.json();code=data.oobCodes?.filter((c:any)=>c.email===email&&c.requestType==='VERIFY_EMAIL').at(-1)?.oobCode||'';return !!code;}).toBe(true);
 const response=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:update?key=demo-key',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({oobCode:code})});expect(response.ok).toBe(true);
 await page.getByRole('button',{name:'J’ai confirmé mon email'}).click();
}
