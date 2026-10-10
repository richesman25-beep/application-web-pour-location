import { describe, expect, it } from 'vitest';
import { firebaseSettings } from '../src/firebase/config';
import { authErrorMessage } from '../src/services/authErrors';
describe('configuration Firebase publiée', () => {
  it('utilise le projet réel dans un build sans variables Netlify', () => {
    const settings = firebaseSettings({ PROD: true });
    expect(settings.emulator).toBe(false);
    expect(settings.config.projectId).toBe('mon-projet-ia-891e5');
    expect(settings.config.apiKey).not.toBe('demo-key');
  });
  it('ne connecte jamais un build publié aux émulateurs même avec un ancien flag', () => {
    expect(firebaseSettings({ PROD: true, VITE_USE_EMULATORS: 'true' }).emulator).toBe(false);
  });
  it('refuse des variables de démonstration dans une compilation publiée',()=>{for(const env of [{VITE_FIREBASE_PROJECT_ID:'demo-lokasyon'},{VITE_FIREBASE_API_KEY:'demo-key'},{VITE_FIREBASE_STORAGE_BUCKET:'demo-lokasyon.appspot.com'}])expect(()=>firebaseSettings({PROD:true,...env})).toThrow('démonstration interdite');});
  it('garde les tests locaux sur le projet démo', () => {
    const settings = firebaseSettings({ PROD: false });
    expect(settings.emulator).toBe(true);
    expect(settings.config.projectId).toBe('demo-lokasyon');
  });
  it('permet le projet réel en développement avec un flag explicite', () => {
    const settings = firebaseSettings({ PROD: false, VITE_USE_EMULATORS: 'false' });
    expect(settings.emulator).toBe(false);
    expect(settings.config.projectId).toBe('mon-projet-ia-891e5');
  });
  it('préserve les surcharges de configuration pour un autre projet', () => {
    expect(firebaseSettings({ PROD: true, VITE_FIREBASE_PROJECT_ID: 'autre-projet' }).config.projectId).toBe('autre-projet');
  });
});
describe('erreurs d’authentification', () => {
  it('explique quand il faut activer Email/Password', () => {
    expect(authErrorMessage({code:'auth/operation-not-allowed'})).toContain('Activez Email/Password');
  });
  it('distingue un compte existant et une panne réseau', () => {
    expect(authErrorMessage({code:'auth/email-already-in-use'})).toContain('déjà un compte');
    expect(authErrorMessage({code:'auth/network-request-failed'})).toContain('inaccessible');
  });
});
