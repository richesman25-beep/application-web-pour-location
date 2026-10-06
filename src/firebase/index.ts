import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import {getFunctions,connectFunctionsEmulator} from 'firebase/functions';
import { firebaseSettings } from './config';

const settings = firebaseSettings((import.meta as any).env);
export const emulator = settings.emulator;
const app = initializeApp(settings.config);
export const auth = getAuth(app), db = getFirestore(app), storage = getStorage(app);
export const functions=getFunctions(app,'us-central1');
if (emulator) {
  const host = window.location.hostname;
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectStorageEmulator(storage, host, 9199);
  connectFunctionsEmulator(functions,host,5001);
}
