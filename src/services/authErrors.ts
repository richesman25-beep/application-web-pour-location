const messages: Record<string, string> = {
  'auth/email-already-in-use': 'Cet email possède déjà un compte. Cliquez sur « J’ai déjà un compte » pour vous connecter.',
  'auth/invalid-email': 'Veuillez saisir une adresse email valide.',
  'auth/weak-password': 'Choisissez un mot de passe d’au moins 6 caractères.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/wrong-password': 'Email ou mot de passe incorrect.',
  'auth/user-not-found': 'Email ou mot de passe incorrect.',
  'auth/operation-not-allowed': 'La connexion par email n’est pas activée. Activez Email/Password dans Firebase → Authentication.',
  'auth/configuration-not-found': 'Firebase Authentication n’est pas configuré. Activez Email/Password dans la console Firebase.',
  'auth/unauthorized-domain': 'Ajoutez le domaine de ce site aux domaines autorisés dans Firebase → Authentication → Settings.',
  'auth/network-request-failed': 'Firebase est inaccessible. Vérifiez votre connexion Internet et, en mode local, le démarrage des émulateurs.',
  'auth/too-many-requests': 'Trop de tentatives. Patientez quelques minutes avant de réessayer.',
  'auth/invalid-api-key': 'La configuration Firebase du site est incorrecte. Vérifiez la clé API Web puis reconstruisez le site.',
};
export function authErrorMessage(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  return messages[code] || 'Impossible de créer le compte ou de se connecter. Vérifiez la configuration Firebase et réessayez.';
}
