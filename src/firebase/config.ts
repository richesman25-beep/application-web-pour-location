type Environment = Record<string, string | boolean | undefined>;

// Firebase Web configuration is public; never put a service-account key here.
const liveConfig = {
  apiKey: 'AIzaSyB5smQiLFrw3GQcvpzDrzo0Bj2Q1qF3Tr0',
  authDomain: 'mon-projet-ia-891e5.firebaseapp.com',
  projectId: 'mon-projet-ia-891e5',
  storageBucket: 'mon-projet-ia-891e5.firebasestorage.app',
  messagingSenderId: '685724867085',
  appId: '1:685724867085:web:383b6cfdbedabd38c19344',
};
const demoConfig = {
  apiKey: 'demo-key',
  authDomain: 'demo-lokasyon.firebaseapp.com',
  projectId: 'demo-lokasyon',
  storageBucket: 'demo-lokasyon.appspot.com',
  messagingSenderId: '',
  appId: '',
};

export function firebaseSettings(env: Environment) {
  // Published builds always use real Firebase, never local emulator ports.
  const emulator = env.PROD !== true && env.VITE_USE_EMULATORS !== 'false';
  const defaults = emulator ? demoConfig : liveConfig;
  const value = (name: string, fallback: string) =>
    typeof env[name] === 'string' && env[name] ? String(env[name]) : fallback;
  return {
    emulator,
    config: {
      apiKey: value('VITE_FIREBASE_API_KEY', defaults.apiKey),
      projectId: value('VITE_FIREBASE_PROJECT_ID', defaults.projectId),
      authDomain: value('VITE_FIREBASE_AUTH_DOMAIN', defaults.authDomain),
      storageBucket: value('VITE_FIREBASE_STORAGE_BUCKET', defaults.storageBucket),
      appId: value('VITE_FIREBASE_APP_ID', defaults.appId),
      messagingSenderId: value('VITE_FIREBASE_MESSAGING_SENDER_ID', defaults.messagingSenderId),
    },
  };
}
