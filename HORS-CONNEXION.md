# Utiliser LOKASYON LAKAY sans Internet

## Préparer l’appareil

Déployez d’abord les nouvelles règles Firestore, puis activez la nouvelle version Netlify. Les mutations utilisent les nouveaux reçus de synchronisation : sans ces règles, les enregistrements seront refusés. Fermez les anciennes fenêtres de l’application puis ouvrez-la avec Internet, connectez-vous et attendez le chargement des données. L’installation sur l’écran d’accueil reste disponible ; le mode hors connexion fonctionne aussi dans un navigateur compatible avec IndexedDB et les service workers, en HTTPS ou localhost.

Le premier démarrage et une nouvelle connexion à un compte nécessitent Internet. La session déjà ouverte permet ensuite de retrouver les données chargées sur ce même appareil. Les données sont conservées localement : utilisez un appareil personnel ou protégé. Effacer les données du site, utiliser une navigation privée ou désinstaller avec suppression du stockage peut faire perdre les saisies non synchronisées.

## Saisir hors connexion

La bannière **Hors connexion** indique l’état du réseau. Vous pouvez consulter les clients, biens, locations, factures et rapports déjà chargés ; les photos distantes non chargées ne sont pas disponibles.

Les formulaires habituels enregistrent dans la file locale :

- Création ou modification de clients, biens, catégories et paramètres d’entreprise.
- Nouvelle location et conversion d’une pro forma, sous réserve du stock réel au retour du réseau.
- Paiement d’une location existante et retour d’un bien.
- Création ou modification d’une pro forma et changement de son statut.

Le message **Enregistré sur cet appareil, en attente de synchronisation** confirme le stockage local. Aucun numéro définitif n’est attribué et aucun stock partagé n’est réservé avant validation par Firebase. Les listes et soldes affichent les dernières données synchronisées, pas les saisies provisoires. Les nouveaux clients, biens et pro forma seront utilisables et leurs documents imprimables après synchronisation. La file affiche séparément les saisies en attente.

Pour une modification, la fiche doit avoir été chargée auparavant. Si elle change sur un autre appareil, la synchronisation refuse de remplacer la nouvelle version : vérifiez-la et ressaisissez votre correction. La saisie refusée reste dans la file jusqu’à son retrait.

L’ajout de photos, la validation des écritures comptables, les clôtures comptables et l’administration de plateforme nécessitent Internet. Les locations synchronisées peuvent ensuite être importées dans la comptabilité avec son bouton habituel.

## Synchroniser

Gardez l’application ouverte ou rouvrez-la avec le même compte et la même organisation au retour du réseau. La synchronisation démarre automatiquement, puis réessaie les opérations en attente toutes les vingt secondes. **File d’attente → Synchroniser maintenant** permet aussi de la lancer. Il n’y a pas d’envoi garanti lorsque l’application est fermée, notamment sur iPhone.

Chaque opération possède un identifiant unique. Sa confirmation est enregistrée dans la même transaction que les données métier : si le réseau coupe après validation, réessayer cette opération ne crée pas un second paiement, une seconde location ou un second client. La date de saisie initiale est conservée pour la facture et le paiement.

Firebase vérifie les droits, suspensions et contraintes métier au moment de la synchronisation. Une quantité devenue indisponible, un paiement dépassant le solde restant ou un retour déjà clôturé est signalé **À vérifier**. Les opérations suivantes indépendantes peuvent continuer. Corrigez la cause et cliquez **Réessayer**, ou sauvegardez puis retirez la saisie refusée et ressaisissez-la à partir des données actuelles. Les saisies en attente restent protégées contre un retrait pendant un envoi dont la confirmation pourrait être perdue.

**Sauvegarder les saisies** télécharge les opérations de ce compte et de cette organisation en JSON, à conserver comme sauvegarde ou justificatif. Ce fichier contient les informations saisies ; le module ne propose pas d’import automatique de cette sauvegarde. L’affichage de la file est limité aux cent dernières opérations ; l’export contient toutes les opérations conservées sur cet appareil.

## Publication

```bash
npx firebase deploy --only firestore:rules --project mon-projet-ia-891e5
npm run build
```

Après publication réussie des règles, fusionnez la branche `feature/offline-sync` dans `main`, puis redéployez `main` sur Netlify ou publiez le dossier `dist`. La branche dédiée permet de préparer les règles avant une éventuelle publication automatique Netlify. Les reçus de synchronisation utilisent la collection `offlineOperations`, accessible à leur auteur et immuable. Aucun nouveau service serveur n’est nécessaire. Les fonctions de comptabilité existantes conservent leur propre déploiement.

## Tests locaux complets

Avec les émulateurs `demo-lokasyon` démarrés :

```bash
npm run test:rules
npx vite build --mode offline-test --outDir .cache/offline-test
npx vite preview --outDir .cache/offline-test --port 4174 --host 0.0.0.0
```

Dans un autre terminal :

```bash
npm run test:e2e -- tests/e2e/offline.spec.ts
```

Le mode de compilation `offline-test` produit une interface compilée et un service worker tout en forçant les émulateurs. Ne publiez jamais ce dossier de test : `npm run build` normal continue d’utiliser Firebase réel. Les tests de règles réinitialisent les données locales ; lancez-les avant les tests navigateur. Le test hors connexion vérifie le redémarrage, les données locales, les saisies, le conflit de stock et une confirmation de paiement perdue.
