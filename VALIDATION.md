# Validation de la livraison

## Vérifications exécutées dans le cloud

- Compilation TypeScript et bundle Vite réussis.
- Compilation du serveur Firebase Functions réussie.
- 14 tests Vitest réussis : calculs de location, caution séparée des revenus, paiements, pénalités, fuseau horaire haïtien et configuration Firebase réelle/local.
- 5 tests serveur réussis : rôle actif, protection contre l’auto-suspension, identifiants, rôles et paramètres.
- 10 tests de sécurité Firestore/Storage réussis sur les véritables émulateurs : absence d’auto-promotion, isolation des entreprises, protection des paramètres et audits, suspension des comptes/membres, suspension d’entreprise, maintenance et fermeture de création d’entreprises.
- 1 test d’intégration des fonctions réussit le scénario multi-actions : refus d’un utilisateur ordinaire ou anonyme, liste des comptes, suspension/réactivation des comptes et entreprises, rôles des membres, promotions et révocations, paramètres globaux, lien de réinitialisation et audit.
- 3 tests Playwright réussis : authentification ; console super-admin ; parcours client → location → paiement → facture PDF → retour → stock. Les pages de gestion et la console sont vérifiées aux largeurs 360, 390, 768, 1024 et 1440 px, sans débordement horizontal ni erreur JavaScript.

Les téléchargements officiels des émulateurs Firestore et Storage fonctionnent désormais dans cet environnement. Firebase CLI conserve sa vérification des fichiers téléchargés. Authentication, Firestore, Storage et Functions ont démarré et ont été exercés ensemble.

## Publication et limites

Les tests modifient exclusivement `demo-lokasyon`, jamais `mon-projet-ia-891e5`. Aucun compte réel n’a été créé, promu, suspendu ou supprimé. Le rôle super-admin est implémenté ; le premier compte sera désigné plus tard depuis un environnement de confiance.

Les fonctions et règles de production ne sont pas déployées par cette livraison. Leur activation et les étapes du premier super-admin sont décrites dans `SUPERADMIN.md`. Firebase Cloud Functions requiert normalement Blaze ; un déploiement de l’interface Netlify seul ne suffit pas aux actions serveur. Email/Password et les domaines autorisés demeurent des prérequis Firebase.

Les émulateurs ont utilisé le Node.js 24 présent dans ce cloud ; les fonctions publiées ciblent Node.js 22. Le bundle Firebase produit un avertissement de taille Vite, sans erreur de compilation ; le PDF est chargé à la demande.

La fermeture des nouvelles entreprises est imposée par les règles Firestore mais ne ferme pas l’API publique de création de comptes Authentication. Les exports CSV portent sur les listes chargées et ne sont pas une sauvegarde complète. Les validations financières actuelles restent dans les transactions du client authentifié ; voir README.md pour le durcissement nécessaire avant une exploitation sensible.

## Reproduire les tests

Depuis la racine du projet :

```bash
npm ci
npm ci --prefix functions
npm run build:server
npm run emulators
```

Dans un autre terminal, lancez `npm run dev`. Puis exécutez les vérifications sans paralléliser les suites qui partagent la base locale :

```bash
npm run test
npm run test:server
npm run test:rules
node --test tests/rules/functions.test.mjs
npm run test:e2e
npm run build
```

Les tests de règles effacent les données de l’émulateur ; ne les lancez pas sur des données locales à conserver.

## Pro forma — 6 octobre 2026

- Build TypeScript/Vite réussi.
- 20 tests unitaires réussis, dont 6 sur les montants, la validité et les conversions pro forma.
- 11 tests des règles Firebase réussis, dont isolation des pro forma, absence de paiement, conversion avec références, interdiction de modifier/supprimer un document converti et verrouillage après annulation.
- Parcours navigateur pro forma réussi : création, édition, PDF (contenu vérifié avec pdftotext), visibilité à l’impression, 4 pages sur 5 largeurs, stock et paiements inchangés avant conversion, facture définitive après conversion, refus du stock insuffisant et annulation.
- Parcours navigateur de location existant réussi : client, stock, paiement, retour, PDF et responsive.
- Un passage navigateur pendant des modifications avec rechargement Vite a interrompu le téléchargement PDF. Le parcours relancé après stabilisation des fichiers a réussi.
- Tests réalisés exclusivement sur les émulateurs demo-lokasyon. Les règles Firebase de production et Netlify doivent être redéployés ; ce contrôle local ne constitue pas une validation du site public.
