import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {onAuthStateChanged,type User,signOut} from 'firebase/auth';
import {collection,doc,onSnapshot,setDoc,getDoc} from 'firebase/firestore';
import {auth,db} from '../firebase';
import {defaults,type Row} from '../types';
import {siteDefaults,type SiteSettings} from '../types/platform';
type State={user:User|null;ready:boolean;loading:boolean;org:string;role:string;superAdmin:boolean;accessError:string;data:Record<string,Row[]>;settings:typeof defaults;site:SiteSettings;error:string;logout:()=>Promise<void>};
const Context=createContext<State>(null!);
export function Provider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[loading,setLoading]=useState(true),[role,setRole]=useState(''),[superAdmin,setSuperAdmin]=useState(false),[accessError,setAccessError]=useState(''),[error,setError]=useState(''),[data,setData]=useState<Record<string,Row[]>>({}),[settings,setSettings]=useState(defaults),[site,setSite]=useState(siteDefaults);
 const org=user?(sessionStorage.getItem('organizationId')||user.uid):'';
 useEffect(()=>onSnapshot(doc(db,'platform','settings'),s=>setSite({...siteDefaults,...s.data()}),()=>{}),[]);
 useEffect(()=>onAuthStateChanged(auth,u=>{setLoading(!!u);setUser(u);setReady(true);setData({});setSettings(defaults);setRole('');setSuperAdmin(false);setAccessError('');setError('');}),[]);
 useEffect(()=>{
  if(!user){setLoading(false);return;}
  let alive=true;const stops:(()=>void)[]=[];setLoading(true);
  const timeout=setTimeout(()=>{if(alive){setError('Firebase ne répond pas. Vérifiez les services Firebase et la configuration réseau.');setLoading(false);}},15000);
  let suspended=false,disabled=false,memberDisabled=false;
  const updateAccess=()=>{if(alive)setAccessError(disabled?'Votre compte a été suspendu. Contactez le support.':suspended?'Cette entreprise est suspendue. Contactez le support.':memberDisabled?'Votre accès à cette entreprise a été suspendu.':'');};
  (async()=>{try{
   const adminRef=doc(db,'superAdmins',user.uid),statusRef=doc(db,'accountStatus',user.uid);
   const [admin,status]=await Promise.all([getDoc(adminRef),getDoc(statusRef)]);
   if(!alive)return;disabled=status.data()?.disabled===true;setSuperAdmin(admin.data()?.active===true&&!disabled);updateAccess();
   stops.push(onSnapshot(adminRef,s=>{if(alive)setSuperAdmin(s.data()?.active===true&&!disabled);},()=>setSuperAdmin(false)));
   stops.push(onSnapshot(statusRef,s=>{disabled=s.data()?.disabled===true;updateAccess();if(disabled)setSuperAdmin(false);}));
   if(disabled){clearTimeout(timeout);setLoading(false);return;}
   const orgRef=doc(db,'organizations',org),memberRef=doc(db,'organizations',org,'users',user.uid);
   const [organization,member]=await Promise.all([getDoc(orgRef),getDoc(memberRef)]);
   if(!alive)return;
   suspended=organization.data()?.status==='suspended';memberDisabled=member.data()?.disabled===true;updateAccess();
   if(suspended||memberDisabled){clearTimeout(timeout);setLoading(false);return;}
   if(!member.exists()&&org!==user.uid)throw new Error('Votre compte n’est pas membre de cette organisation.');
   if(!member.exists()){
    if(!organization.exists())await setDoc(orgRef,{organizationId:org,name:'Lokasyon',status:'active',createdAt:new Date().toISOString()});
    await setDoc(memberRef,{organizationId:org,role:'admin',email:user.email});
   }
   if(!alive)return;setRole(member.data()?.role||'admin');
   stops.push(onSnapshot(orgRef,s=>{suspended=s.data()?.status==='suspended';updateAccess();}));
   stops.push(onSnapshot(memberRef,s=>{memberDisabled=!s.exists()||s.data()?.disabled===true;if(alive)setRole(s.data()?.role||'');updateAccess();}));
   const loaded=new Set<string>();for(const name of ['customers','categories','assets','rentals','payments','invoices','proformas','settings']){
    stops.push(onSnapshot(collection(db,'organizations',org,name),s=>{if(!alive)return;setData(old=>({...old,[name]:s.docs.map(d=>({...d.data(),id:d.id} as Row))}));if(name==='settings')setSettings({...defaults,...s.docs.find(d=>d.id==='company')?.data()});loaded.add(name);if(loaded.size===8){clearTimeout(timeout);setError('');setLoading(false);}},e=>{if(alive){clearTimeout(timeout);setError(e.message);setLoading(false);}}));
   }
  }catch(e){if(alive){clearTimeout(timeout);setError((e as Error).message);setLoading(false);}}})();
  return()=>{alive=false;clearTimeout(timeout);stops.forEach(s=>s());};
 },[user,org]);
 return <Context.Provider value={{user,ready,loading,org,role,superAdmin,accessError,data,settings,site,error,logout:async()=>{sessionStorage.removeItem('organizationId');await signOut(auth);}}}>{children}</Context.Provider>;
}
export const useApp=()=>useContext(Context);
