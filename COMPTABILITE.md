# Comptabilité — LOKASYON LAKAY

Le menu **Comptabilité** est réservé aux administrateurs de l’entreprise. Il contient un plan de comptes, un journal en partie double, un grand livre, une balance, un bilan, un compte de résultat, les clôtures mensuelles et l’historique des opérations.

## Première utilisation

1. Ouvrez **Comptabilité → Initialiser le plan de comptes**. Les 27 comptes de départ couvrent clients, fournisseurs, caisse, banque, MonCash, NatCash, cautions, capital, matériel, salaires, taxes, amortissements et charges courantes.
2. Vérifiez les comptes avec votre comptable. Vous pouvez ajouter des comptes et modifier leurs intitulés. Le type d’un compte existant est fixe ; les comptes utilisés par les imports restent actifs.
3. Cliquez sur **Importer factures & paiements**. Les factures de location et les paiements sont parcourus par lots. Les pro forma sont exclus. Les pièces en erreur restent affichées pour correction.
4. Saisissez les soldes d’ouverture et les opérations hors location dans **Nouvelle écriture**. Choisissez la date, la devise, la référence du justificatif, le libellé et les comptes. Les modèles aident à saisir dépenses, fournisseurs, apports, transferts, remboursements de cautions et amortissements.
5. Sélectionnez HTG ou USD et les dates des rapports, puis imprimez ou exportez les tableaux CSV. Le dialogue d’impression du navigateur permet aussi d’enregistrer un PDF.

## Règles comptables

Les montants enregistrés dans le journal sont des centimes entiers. Le serveur exige un total débit égal au total crédit, des comptes actifs et une seule devise par écriture. Chaque ligne doit contenir un débit ou un crédit positif.

Une facture débite le compte **411 Clients** du total, crédite **706 Revenus des locations** du montant de location et **165 Cautions remboursables** de la caution facturée. Un paiement débite le compte de caisse, banque ou portefeuille correspondant et crédite **411 Clients**. Le moyen « Crédit » n’est pas un encaissement et ne s’importe pas comme tel.

Les produits du compte de résultat sont reconnus à la facture : ils peuvent donc différer des recettes encaissées du tableau de bord. Une caution facturée est au passif, même lorsqu’elle n’est pas encore encaissée. Son remboursement se saisit manuellement au journal avec un justificatif ; cette saisie ne modifie pas la location ni ses paiements.

HTG et USD restent séparés. Il n’y a pas de conversion automatique ni de bilan consolidé multidevise. Les charges, salaires, taxes, factures fournisseurs et immobilisations se saisissent par écritures ; le module ne calcule pas automatiquement la paie, les déclarations fiscales ou les amortissements, et ne se connecte pas aux banques. Ce plan de départ doit être adapté aux obligations de votre entreprise avec votre comptable.

## Imports et corrections

Répétez **Importer factures & paiements** après les nouvelles opérations de location. Il s’agit d’un import déclenché par l’administrateur, pas d’une synchronisation en arrière-plan. Réimporter une pièce inchangée ne crée pas de doublon. Une modification du montant de location ou de caution génère un ajustement daté du jour, sans remplacer l’écriture initiale.

Un paiement déjà comptabilisé dont les données changent est signalé pour contrôle : corrigez par une écriture justifiée. Les écritures manuelles ne se suppriment ni ne se modifient. Le bouton **Contrepasser** enregistre une nouvelle écriture inversée et conserve l’original. Les imports se corrigent par les ajustements des sources ou des écritures manuelles, sans contrepassation automatique des pièces importées.

Avant de commencer avec des données existantes, importez les pièces puis rapprochez-les avec les justificatifs et soldes réels. Ne ressaisissez pas manuellement les factures et paiements déjà importés.

## Clôtures et sécurité

Contrôlez les deux devises, les erreurs d’import et les soldes avant **Clôtures → Clôturer**. Une clôture mensuelle bloque les nouvelles écritures à une date de ce mois, y compris un premier import de factures anciennes. Une réouverture exige un motif et reste dans l’historique. La clôture ne produit pas automatiquement les écritures annuelles de report du résultat.

Les employés ne peuvent pas consulter la comptabilité. Les écritures, comptes, périodes, traces d’import, historique et compteur du journal ne peuvent pas être modifiés directement par le navigateur, même par un administrateur. Les fonctions serveur vérifient l’organisation, le rôle, les suspensions et le mode maintenance à chaque transaction. Le super-administrateur conserve son accès de lecture prévu par les règles de plateforme.

## Résolution de « Le service comptable est indisponible »

Le frontend appelle sept fonctions **callable v2**, toutes dans **us-central1** : `accountingStatus`, `accountingInitialize`, `accountingSaveAccount`, `accountingPost`, `accountingReverse`, `accountingSetPeriod`, `accountingSync`. Elles sont exportées dans `functions/src/index.ts`, compilées dans `functions/lib` et déployées depuis `functions` avec Node 22. Le `predeploy` Firebase compile le serveur automatiquement.

Le bouton **Vérifier le service comptable** appelle `accountingStatus` : aucun document n’est créé ou modifié. Il vérifie l’identité, l’email confirmé, le rôle admin de l’entreprise, les suspensions et la maintenance, puis indique si le plan est initialisé. Un succès de cette vérification ne garantit pas les permissions de lecture du navigateur : les règles Firestore doivent aussi être publiées.

- **Fonction introuvable** : vérifier les noms, le projet ciblé et la région. Le message précédent amalgamait cette erreur avec les erreurs internes et réseau ; elles sont désormais distinguées.
- **Temporairement inaccessible** : vérifier le réseau et l’état Firebase avant de redéployer.
- **Erreur serveur** : consulter les journaux ; ne pas ressaisir une écriture tant que son enregistrement n’a pas été vérifié.
- **Session expirée / accès refusé** : se reconnecter, confirmer l’email, vérifier le membre `organizations/{org}/users/{uid}` avec `role: admin`, les suspensions et la maintenance. Ne pas modifier les règles pour ouvrir l’accès.
- **Lecture Firestore refusée** : vérifier les règles publiées et le jeton actualisé après confirmation email. Les écritures comptables directes restent interdites, même aux admins.

Les builds Web/Android utilisent le projet réel par défaut. Retirer les variables `demo-lokasyon`/`demo-key` des paramètres Netlify et fichiers `.env.local` utilisés pour publier. Une compilation publiée avec ces valeurs est désormais refusée. Le mode `offline-test` est réservé aux tests et ne doit jamais être publié. Conserver les variables personnalisées réelles si elles correspondent au projet choisi.

## Préparation et publication Firebase

**Aucun déploiement réalisé.** L’environnement cloud testé n’est pas authentifié auprès de Firebase ; les ressources publiées et IAM ne peuvent donc pas être certifiées. Les commandes suivantes sont à exécuter sur un poste disposant du compte Google autorisé. Node **22.12+** est requis pour l’outillage ; Functions utilise Node 22.

1. Récupérer la branche préparée, sans fusionner automatiquement `main` :
   ```sh
   git fetch origin
   git switch feature/android-apk
   git pull --ff-only origin feature/android-apk
   npm ci
   npm ci --prefix functions
   npm run build
   npm run check:accounting
   ```
   `check:accounting` vérifie les exports compilés, la région, le runtime et la configuration predeploy sans accéder à une base ni déployer. La configuration Firebase Web est publique ; elle n’est pas une clé serveur.
2. Authentifier la CLI et vérifier le bon projet :
   ```sh
   npx firebase login
   npx firebase projects:list
   npx firebase functions:list --project mon-projet-ia-891e5
   ```
   Le projet doit disposer d’une base Firestore `(default)` et de la facturation requise pour Functions (plan Blaze). Tester d’abord sur un projet staging avec les variables Firebase correspondantes. Sauvegarder et contrôler les données existantes suivant `SECURITY_MIGRATION.md` avant les règles plus strictes. Les comptes non vérifiés doivent être accompagnés pour confirmer leur email ; les clients Android doivent être compatibles.
3. Après validation et décision de mise en production, déployer les fonctions et les règles actuelles du projet ensemble :
   ```sh
   npx firebase deploy --project mon-projet-ia-891e5 --only functions,firestore:rules,storage
   ```
   Ne pas utiliser `--force` pour accepter une suppression inattendue de fonction. Les fonctions métier/photos et les règles privées doivent rester cohérentes avec cette version web : un déploiement comptable isolé ne résout pas les autres services non publiés.
4. Si le déploiement signale une erreur IAM : identifier le compte déployeur et le compte d’exécution dans le message. Le déployeur doit pouvoir déployer Functions, utiliser le compte d’exécution, modifier les règles et accéder aux services de build requis. Le compte d’exécution doit pouvoir accéder aux données Firestore ; ne pas lui accorder Owner/Editor comme correctif universel. En cas de 403 Cloud Run avant exécution, vérifier la possibilité d’invocation HTTPS des callables ; l’autorisation utilisateur reste contrôlée dans le code. Ne jamais ouvrir les données Firestore au public. Ces permissions réelles n’ont pas été contrôlées dans cette session.
5. Vérifier les exports publiés et examiner les journaux si nécessaire :
   ```sh
   npx firebase functions:list --project mon-projet-ia-891e5
   npx firebase functions:log --project mon-projet-ia-891e5 --only accountingStatus,accountingInitialize,accountingPost,accountingSync
   ```
   Puis publier le frontend préparé par le canal Netlify habituel ou publier `dist`. Le push vers une branche suivie par Netlify peut déclencher cette publication ; ne fusionner vers la branche de production qu’au moment choisi.

## Recette après publication

Avec un compte **admin d’entreprise, email confirmé**, ouvrir Comptabilité → Vérifier le service comptable. Initialiser le plan seulement pour une entreprise qui le nécessite, puis contrôler les 27 comptes. Les tests de paiement, imports et écritures doivent être faits en staging ; ne pas introduire de fausses écritures dans la comptabilité réelle. En production, importer les pièces réelles validées, contrôler leurs erreurs et rapprocher les soldes avec les justificatifs. Vérifier aussi le refus d’accès pour les collaborateurs et les écritures directes. Les fonctions ne calculent pas la paie ou la fiscalité automatiquement.

## Vérification locale exécutée

```sh
npm test
npm run test:server
npm run check:accounting
```

Avec les émulateurs de `demo-lokasyon` et Vite déjà démarrés :

```sh
npm run test:rules
node --test tests/rules/accounting-functions.test.mjs
npm run test:e2e -- tests/e2e/accounting.spec.ts
```

Exécuter successivement les suites Firebase : les tests de règles réinitialisent leurs fixtures locales. Le parcours comptable couvre la vérification sans écriture, l’initialisation, les imports répétés, la partie double, le CSV, les contrepassations, les devises et les largeurs mobile/ordinateur. Les tests ne modifient pas le projet réel. Les règles actuelles restent sécurisées ; aucune permission élargie pour contourner une erreur.

Résultats locaux du 10 octobre 2026 : compilation web et Functions réussie ; 40 tests frontend, 15 tests backend, 17 tests de règles, 1 intégration comptable et 1 parcours navigateur comptable réussis. Deux audits npm complets (racine et Functions) : 0 vulnérabilité signalée. Le refus d’une compilation publiée contenant un projet démo a été reproduit. L’inspection IAM, la livraison réseau de production et le déploiement n’ont pas été réalisés.
