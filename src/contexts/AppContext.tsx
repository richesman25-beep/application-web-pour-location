import {createContext,useContext,useEffect,useState,type ReactNode} from 'react';
import {onAuthStateChanged,type User,signOut} from 'firebase/auth';
import {collection,doc,onSnapshot,setDoc,getDoc} from 'firebase/firestore';
import {auth,db} from '../firebase';
import {defaults,type Row} from '../types';
type State={user:User|null;ready:boolean;loading:boolean;org:string;role:string;data:Record<string,Row[]>;settings:typeof defaults;error:string;logout:()=>Promise<void>};
const Context=createContext<State>(null!);
export function Provider({children}:{children:ReactNode}){
 const [user,setUser]=useState<User|null>(null),[ready,setReady]=useState(false),[loading,setLoading]=useState(true),[role,setRole]=useState(''),[error,setError]=useState(''),[data,setData]=useState<Record<string,Row[]>>({}),[settings,setSettings]=useState(defaults);
 const org=user?(sessionStorage.getItem('organizationId')||user.uid):'';
 useEffect(()=>onAuthStateChanged(auth,u=>{setUser(u);setReady(true);setData({});setRole('');setError('');}),[]);
 useEffect(()=>{if(!user){setLoading(false);return;}setLoading(true);let stops:(()=>void)[]=[],alive=true;const timeout=setTimeout(()=>{if(alive){setError('Firebase ne répond pas. Démarrez les émulateurs ou vérifiez la configuration réseau.');setLoading(false);}},15000);
 (async()=>{try{
 const member=await getDoc(doc(db,'organizations',org,'users',user.uid));
 if(!member.exists()&&org!==user.uid)throw new Error('Votre compte n’est pas membre de cette organisation.');
 if(!member.exists()){await setDoc(doc(db,'organizations',org),{organizationId:org,name:'Lokasyon'});await setDoc(doc(db,'organizations',org,'users',user.uid),{organizationId:org,role:'admin',email:user.email});}
 if(!alive)return;setRole(member.data()?.role||'admin');
 const loaded=new Set<string>();for(const name of ['customers','categories','assets','rentals','payments','invoices','settings']){
 stops.push(onSnapshot(collection(db,'organizations',org,name),s=>{if(!alive)return;const rows=s.docs.map(d=>({...d.data(),id:d.id} as Row));setData(old=>({...old,[name]:rows}));if(name==='settings')setSettings({...defaults,...rows.find(r=>r.id==='company')});loaded.add(name);if(loaded.size>=7){clearTimeout(timeout);setError('');setLoading(false);}},e=>{setError(e.message);setLoading(false);}));}
 }catch(e){if(alive){setError((e as Error).message);setLoading(false);}}})();return()=>{alive=false;clearTimeout(timeout);stops.forEach(s=>s());};},[user,org]);
 return <Context.Provider value={{user,ready,loading,org,role,data,settings,error,logout:async()=>{sessionStorage.removeItem('organizationId');await signOut(auth);}}}>{children}</Context.Provider>;
}
export const useApp=()=>useContext(Context);
