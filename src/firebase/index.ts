import {initializeApp} from 'firebase/app';
import {getAuth,connectAuthEmulator} from 'firebase/auth';
import {getFirestore,connectFirestoreEmulator} from 'firebase/firestore';
import {getStorage,connectStorageEmulator} from 'firebase/storage';
const e=(import.meta as any).env;
export const emulator=e.VITE_USE_EMULATORS!=='false';
const app=initializeApp({apiKey:e.VITE_FIREBASE_API_KEY||'demo-key',projectId:e.VITE_FIREBASE_PROJECT_ID||'demo-lokasyon',authDomain:e.VITE_FIREBASE_AUTH_DOMAIN||'demo-lokasyon.firebaseapp.com',storageBucket:e.VITE_FIREBASE_STORAGE_BUCKET||'demo-lokasyon.appspot.com',appId:e.VITE_FIREBASE_APP_ID});
export const auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
if(emulator){const host=window.location.hostname;connectAuthEmulator(auth,`http://${host}:9099`,{disableWarnings:true});connectFirestoreEmulator(db,host,8080);connectStorageEmulator(storage,host,9199);}
