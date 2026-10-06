# Super-administration de Lokasyon

Le rôle super-admin est ajouté. Aucun compte de production n'a été créé, promu ou supprimé. Un compte d'entreprise créé depuis le site reste un administrateur d'entreprise ordinaire.

## Fonctions de la console

La route `/super-admin` contient :

- Vue globale avec compteurs des entreprises chargées, statuts et état du site.
- Entreprises : recherche, coordonnées, membres, suspension et réactivation avec motif. Une suspension conserve les données et bloque leur accès pour les membres.
- Comptes Firebase : liste paginée, recherche par email, suspension/réactivation, génération d'un lien de réinitialisation de mot de passe. Aucun email n'est envoyé automatiquement ; le lien doit être remis au titulaire par un canal sûr.
- Membres : ajout/modification par UID, rôle `admin`/`employee`, suspension de l'accès à une entreprise. Le propriétaire ne peut pas être rétrogradé ; suspendez son entreprise si nécessaire.
- Paramètres du site : nom, email de support, annonce, mode maintenance et fermeture de la création de nouvelles entreprises.
- Super-admins : ajout et retrait de ce rôle sur d'autres comptes. On ne peut pas retirer son propre rôle ni désactiver un super-admin actif sans lui retirer d'abord ce rôle.
- Journal : opérations horodatées avec acteur, cible et motif, export CSV des dernières actions. Les liens de réinitialisation ne sont pas consignés dans le journal.

La suspension d'un compte modifie Firebase Authentication, révoque les refresh tokens et bloque les données pour les sessions déjà ouvertes grâce à `accountStatus`. Le journal indique aussi les opérations de suspension partiellement échouées. La maintenance bloque les données métier des utilisateurs ordinaires, tout en gardant la console super-admin accessible. La fermeture des inscriptions interdit la création d'entreprises côté règles : elle ne désactive pas techniquement l'endpoint public de création de comptes de Firebase Authentication.

Les exports portent sur les listes chargées ; ils ne constituent pas une sauvegarde complète de Firebase. Ce module ne gère pas la facturation Firebase/Netlify ni les abonnements commerciaux. Il ne supprime pas définitivement des entreprises ou des comptes.

## Activer sur votre site

Netlify héberge l'interface. Les opérations d'administration des comptes sont exécutées par Firebase Cloud Functions, dans `us-central1`, après vérification du rôle à chaque appel. Le forfait Firebase Blaze et une facturation configurée sont normalement requis pour déployer ces fonctions. Les frais éventuels dépendent de l'utilisation ; le code limite à cinq instances par fonction.

Dans un terminal à la racine du projet, avec Node.js 22 :

```bash
npm ci
npm ci --prefix functions
npx firebase login
npx firebase deploy --only functions,firestore:rules,storage --project mon-projet-ia-891e5
```

Déployez d'abord les fonctions et règles, puis la dernière version de l'interface sur Netlify. Les nouvelles lectures de `superAdmins` et `accountStatus` requièrent les nouvelles règles. Si ce projet Firebase héberge d'autres applications, fusionnez leurs règles existantes avant tout déploiement : les fichiers fournis couvrent les collections de Lokasyon, pas les collections de ces autres applications. Ne remplacez pas leurs autorisations sans les avoir examinées.

Aucun accès privilégié de déploiement Firebase n'est intégré au navigateur. N'insérez jamais un compte de service ni sa clé privée dans un fichier `VITE_*` ou dans GitHub.

## Désigner votre premier super-admin, après création du compte

1. Créez normalement votre compte sur le site (Email/Password doit être activé).
2. Dans la console Firebase → Authentication → Utilisateurs, ouvrez ce compte et copiez son **UID** (pas son email, ni un identifiant d'entreprise inventé).
3. Dans Firestore → Données, créez une collection racine nommée **`superAdmins`**.
4. Créez un document dont l'identifiant est exactement cet **UID**.
5. Ajoutez **`active`**, de type **boolean / booléen**, avec la valeur **`true`**. Vous pouvez ajouter **`email`** (string / chaîne) avec l'email du compte pour le reconnaître.
6. Reconnectez le compte, puis ouvrez `https://lokasyonlakay.netlify.app/super-admin`. Le menu de votre entreprise propose aussi « Administration du site ».

Cette première attribution est réservée à une personne qui possède déjà un accès de confiance à la console Firebase. Un utilisateur de l'application ne peut pas modifier `superAdmins` directement, même s'il est administrateur d'entreprise. Les promotions suivantes se font depuis la console super-admin et sont journalisées.

Une autre méthode est fournie pour un poste administratif disposant de véritables credentials Admin SDK :

```bash
node scripts/grant-superadmin.mjs UID mon-projet-ia-891e5
```

Ce script refuse de servir de raccourci une fois un super-admin actif déjà présent. Il exige une authentification Admin SDK configurée sur le poste, distincte de la seule configuration Web publique ou de la connexion `firebase login`. La méthode de la console Firebase est la plus simple ici.

## Vérification locale

Installez les dépendances du frontend et du serveur, puis lancez :

```bash
npm run build:server
npm run emulators
```

Dans un autre terminal :

```bash
npm run dev
```

Les émulateurs locaux fournissent Authentication, Firestore, Storage et Functions ; aucun de ces tests ne touche au projet réel.

```bash
npm run test
npm run test:server
npm run test:rules
node --test tests/rules/functions.test.mjs
npm run test:e2e
```

Exécutez les tests de règles et de fonctions avant les tests navigateur, et jamais en parallèle : ils modifient des jeux de données locaux communs. Les tests de règles effacent la base de l'émulateur. La console et les pages métier sont testées aux largeurs 360, 390, 768, 1024 et 1440 px.
