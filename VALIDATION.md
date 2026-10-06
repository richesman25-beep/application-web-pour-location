# Validation de cette livraison

## Vérifié dans l'environnement cloud

- Dépendances installées avec npm ; lockfile présent.
- Compilation TypeScript et bundle Vite : réussis.
- Sept tests Vitest de calcul : réussis (caution distincte des revenus, paiements partiels, durées, dates invalides, valeurs invalides, arrondis, pénalités, conversion du fuseau haïtien).
- Serveur Vite : réponse HTTP 200.
- Écran de connexion du bundle compilé vérifié dans Chromium avec le serveur de prévisualisation.
- Le SDK Firebase constitue un bundle de 571 Ko avant gzip (171 Ko gzip) ; Vite signale sa taille, sans erreur de compilation. Le PDF est chargé à la demande.
- Émulateur Firebase Authentication : démarré.
- Test Playwright : inscription puis connexion via le véritable émulateur Authentication ; écran de connexion aux largeurs 360, 390, 768, 1024 et 1440 px ; absence de débordement horizontal et d'erreur JavaScript : réussi.

## Non encore validé

Le téléchargement officiel des émulateurs Firestore et Storage est bloqué par la politique réseau de l'environnement cloud (`storage.googleapis.com`, HTTP 403). Aucun artifact non vérifié n'a été utilisé. Les domaines nécessaires ont été ajoutés au brouillon de configuration, mais leur activation nécessite l'enregistrement dans les paramètres de l'environnement.

Le test `tests/e2e/workflow.spec.ts` est fourni mais n'a pas encore été exécuté jusqu'à son terme. Il vérifie le parcours client → location → paiement → facture PDF → retour → stock et le responsive des pages de gestion aux cinq tailles. Les opérations de gestion, les règles Firestore/Storage et le PDF ne sont donc pas présentés comme validés en exécution dans cette livraison.

Le projet Firebase réel `mon-projet-ia-891e5` n'a pas été modifié. Son activation Email/Password, sa base Firestore, son bucket Storage, ses domaines autorisés et ses règles restent à vérifier dans la console avant utilisation réelle.

## Reprendre les vérifications

Après autorisation du domaine de téléchargement, arrêtez le processus d'authentification seul si celui-ci fonctionne encore, puis lancez `npm run emulators` pour démarrer les trois services. Dans un autre terminal, lancez `npm run dev`, puis `npm run test:e2e`. Tous les tests E2E doivent être exécutés en mode émulateurs ; retirez temporairement `.env.local` s'il configure le projet réel.

La publication de l'environnement cloud et celle du site n'ont pas été effectuées.

## Correction de la connexion Netlify

Le build publié utilise désormais le vrai projet Firebase par défaut. Des tests de configuration vérifient le mode production, le mode local, les surcharges et les messages d’erreur Authentication. Aucun compte de production n’est créé par ces tests. L’activation Email/Password, les domaines autorisés, Firestore et Storage restent des prérequis dans la console Firebase.

Validation de cette correction : compilation réussie ; 14 tests unitaires réussis ; bundle de production vérifié dans Chromium (SDK Authentication dirigé vers Google, aucun accès aux ports des émulateurs, champ organisation masqué à l’inscription, message Email/Password correct). La requête Authentication du test navigateur a été interceptée : ce contrôle valide le raccordement et le traitement d’erreur, pas l’activation effective du projet réel.
