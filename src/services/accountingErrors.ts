export function accountingErrorMessage(error:unknown,name:string){
 const e=error as {code?:string;message?:string},code=e?.code||'',message=e?.message||'';
 if(code==='functions/not-found')return name==='accountingReverse'&&message==='Écriture introuvable.'?message:`La fonction ${name} est introuvable. Vérifiez le déploiement des fonctions comptables, le projet Firebase et la région us-central1 (COMPTABILITE.md).`;
 if(code==='functions/unavailable')return 'Le service comptable est temporairement inaccessible. Vérifiez votre connexion et l’état des services Firebase, puis réessayez.';
 if(code==='functions/internal')return `Une erreur serveur a interrompu ${name}. Consultez les journaux Firebase Functions. Vérifiez le journal comptable avant de ressaisir une opération ; une nouvelle saisie pourrait créer un doublon.`;
 if(code==='functions/deadline-exceeded')return 'Le délai de réponse du service comptable est dépassé. Vérifiez le journal avant de ressaisir ; l’opération peut avoir été enregistrée.';
 if(code==='functions/unauthenticated')return 'Votre session a expiré. Reconnectez-vous pour accéder à la comptabilité.';
 if(code==='functions/permission-denied')return message||'Accès comptable refusé : vérifiez le rôle administrateur, la confirmation email, les suspensions et la maintenance.';
 return message||'Opération comptable impossible. Réessayez après vérification de votre connexion.';
}
