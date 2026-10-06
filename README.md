# Lokasyon — Gestion de location

Application Web responsive en français pour Haïti : React, TypeScript, Vite, Tailwind, React Router et Firebase (Authentication, Firestore, Storage). Les formulaires sauvegardent dans Firestore ; aucun stockage fictif n'est utilisé.

## Tester sur votre ordinateur

Prérequis : Node.js 22 ou 24, npm et Java 21 pour les émulateurs Firebase. Sur Windows, utilisez Git Bash ou WSL pour les scripts d'émulation et les tests navigateur.

```bash
npm ci
```

Dans un premier terminal, depuis le dossier du projet :

```bash
npm run emulators
```

Dans un deuxième terminal :

```bash
npm run dev
```

Ouvrez le navigateur à l'adresse affichée par Vite (port 5173). Par défaut l'application utilise uniquement les émulateurs locaux et le projet fictif `demo-lokasyon`, sans écrire dans votre projet Firebase réel. Créez un compte avec un email et un mot de passe de test (au moins six caractères), puis ouvrez **Paramètres → Charger les données de démonstration**. Ce bouton fonctionne uniquement sur une organisation vide en mode émulateurs.

Les données de démonstration comprennent Jean Pierre, Marie Joseph et Samuel Louis ; Toyota RAV4, génératrice, Power Bank, chaises, tente et appartement ; des locations actives, terminées, partiellement payées et en retard. Testez une nouvelle location, un paiement complémentaire, la facture PDF puis le retour du bien. Les données survivent aux rechargements du navigateur tant que les émulateurs restent ouverts. Elles sont remises à zéro au redémarrage des émulateurs ; export/import Firebase peut être utilisé pour les conserver.

## Publication sur Netlify

Les builds publiés (`npm run build`) utilisent maintenant directement le projet Firebase `mon-projet-ia-891e5` fourni, même sans variables Netlify. Ils ne se connectent jamais aux ports d'émulation. Le mode `npm run dev` reste local par défaut pour les tests.

La configuration `netlify.toml` fournit la commande de compilation, le dossier `dist` et les redirections React Router. Pour un site Netlify connecté à GitHub, déployez la dernière version de `main`. Pour une publication manuelle, reconstruisez avec `npm run build` puis déposez le nouveau dossier `dist`.

Si vous avez déjà défini des variables `VITE_FIREBASE_*` sur Netlify ou dans `.env.local`, elles remplacent les valeurs du projet par défaut : supprimez les anciennes valeurs `demo-lokasyon` / `demo-key` ou renseignez celles du vrai projet. Les variables ne sont prises en compte qu'à la compilation.

Dans Firebase, activez Authentication → Email/Password, ajoutez `lokasyonlakay.netlify.app` aux domaines autorisés, créez Firestore et Storage puis installez les règles fournies. Ces réglages de la console ne peuvent pas être activés par le code du navigateur. Les erreurs de connexion indiquent désormais le problème renvoyé par Firebase. Le champ d'organisation n'apparaît plus pendant la création du compte administrateur.

## Utiliser votre projet Firebase

Le fichier `.env.firebase.example` contient la configuration Web publique fournie pour `mon-projet-ia-891e5`. Copiez-le vers `.env.local` puis redémarrez Vite. Le fichier `.env.local` est ignoré par Git. Il ne doit jamais contenir une clé privée de compte de service : toute variable préfixée `VITE_` est exposée au navigateur.

Dans la console Firebase :

1. Activez **Authentication → Email/Password** et ajoutez le domaine de votre application aux domaines autorisés.
2. Créez la base **Firestore** et activez **Storage** (un forfait compatible peut être nécessaire).
3. Installez les règles fournies dans `firestore.rules` et `storage.rules` après les avoir relues. La commande ci-dessous modifie votre projet réel ; exécutez-la lorsque vous êtes prêt.

```bash
npx firebase login
npx firebase deploy --only firestore:rules,storage --project mon-projet-ia-891e5
```

Créez ensuite votre compte administrateur via l'application. Un compte administrateur possède son organisation. Dans Paramètres, vous pouvez ajouter l'UID d'un collaborateur créé préalablement dans Authentication ; le collaborateur saisit l'identifiant de l'organisation à la connexion. Le rôle `employee` accède aux clients, biens, locations, paiements, factures et retours ; catégories et paramètres sont réservés aux administrateurs par les routes et les règles Firestore.

Aucun déploiement ni écriture de test n'a été effectué sur votre projet Firebase réel pendant la création du projet.

## Modules

- Tableau de bord : stock, locations actives et en retard, clients, revenus du jour/mois, solde à recevoir, HTG/USD avec taux configurable. Les paiements sont affectés au loyer avant la caution ; les cautions sont exclues des revenus.
- Clients : création, modification, photo, recherche, filtre, statuts et historique.
- Catégories : catégories personnalisées créées par l'administrateur.
- Biens : photo compressée, code interne, quantité, catégorie, état, statut, tarif, caution et localisation.
- Locations : durée et prix centralisés dans `src/services/pricingService.ts`, quantité entière, vérification transactionnelle du stock, facture et premier paiement atomiques.
- Paiements : historique et paiements successifs dans la devise de la location. Les intitulés MonCash, NatCash, carte, etc. enregistrent le moyen utilisé ; ils n'effectuent pas un débit bancaire.
- Factures : consultation, impression et PDF multipage. Le PDF reflète les paiements et pénalités actuels.
- Retours : date réelle, état, photo, pénalité, frais de dommage et clôture atomique. Seuls les biens rendus en bon état redeviennent disponibles ; les unités endommagées, incomplètes ou perdues restent hors du stock disponible.
- Recherche globale et liens WhatsApp avec message préparé, sans API payante.

Les biens marqués Réservé, Maintenance, Endommagé, Perdu ou Hors service ne peuvent pas être loués. Les réservations datées, prolongations, remboursements de caution, locations comprenant plusieurs biens distincts et rapprochement bancaire ne sont pas implémentés dans cette première version. Une location comporte un bien avec une quantité. Les mois tarifaires correspondent à 30 jours.

## Tests

```bash
npm run build
npm run test
npm run test:e2e
```

Les tests E2E nécessitent les trois émulateurs et Vite démarrés, et utilisent exclusivement Firebase local. Chromium est déjà installé dans cet environnement cloud. Ailleurs, installez le navigateur :

```bash
npx playwright install chromium
```

La configuration Playwright utilise `/usr/bin/chromium` uniquement lorsqu'il existe, sinon le navigateur installé par Playwright. Le parcours E2E vérifie la persistance des clients, une location, un paiement, un retour, la restitution du stock, le téléchargement PDF et les pages aux largeurs 360, 390, 768, 1024 et 1440 px. Consultez `VALIDATION.md` pour distinguer les vérifications exécutées des tests bloqués.

## Compilation et publication du site

```bash
npm run build
npm run preview
```

Pour publier sur Firebase Hosting après configuration du projet réel, la configuration SPA est fournie dans `firebase.json` :

```bash
npx firebase deploy --only hosting --project mon-projet-ia-891e5
```

Publication du site et publication de l'environnement cloud sont deux actions distinctes. Le projet n'est pas encore publié.

## Architecture et limites de déploiement

`src/components` : formulaires et layout ; `src/pages` : modules ; `src/contexts` : état authentifié et abonnements Firestore ; `src/services` : calculs et transactions ; `src/firebase` : SDK et émulateurs ; `src/types` : modèles partagés.

Chaque document inclut `organizationId`. Les données appartiennent à `organizations/{organizationId}/{collection}`. Les règles isolent les organisations et protègent les fonctions administratives. Avant un usage de production sensible, ajoutez des validations de schéma exhaustives côté règles ou un backend de confiance pour garantir les invariants financiers face à des appels SDK modifiés ; les contrôles de stock et de montant sont actuellement exécutés dans les transactions du client authentifié.

La liste des clients et biens est paginée dans l'interface ; les abonnements chargent actuellement les collections de l'organisation entière. Pour de gros volumes, remplacez-les par des requêtes paginées/indexées côté Firestore. Les textes sont en français ; une couche de traduction pourra être ajoutée ultérieurement. La PWA n'est pas activée.
