import {test,expect} from '@playwright/test';
test('connexion responsive aux cinq tailles demandées et authentification Firebase locale',async({page,request})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const width of [360,390,768,1024,1440]){await page.setViewportSize({width,height:900});await page.goto('/login');await expect(page.getByRole('heading',{name:'Heureux de vous retrouver'})).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);}
 const email=`auth-${Date.now()}@example.com`;
 const signup=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key',{data:{email,password:'Test123456!',returnSecureToken:true}});expect(signup.ok()).toBe(true);const registered=await signup.json();expect(registered.localId).toBeTruthy();
 const signin=await request.post('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=demo-key',{data:{email,password:'Test123456!',returnSecureToken:true}});expect(signin.ok()).toBe(true);expect((await signin.json()).localId).toBe(registered.localId);
 await page.screenshot({path:'test-results/login-desktop.png',fullPage:true});await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/login-mobile.png',fullPage:true});expect(errors).toEqual([]);
});
