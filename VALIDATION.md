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

## Identité LOKASYON LAKAY — 6 octobre 2026

Logo reproduit depuis la référence fournie en PNG transparent (1448 × 1086), conservé dans `public/images/logo-lokasyon-lakay.png`. Intégration dans la connexion, le menu latéral, l’en-tête mobile, l’espace super-admin et les écrans de chargement, y compris le contenu HTML initial. Titre et noms par défaut mis à jour ; les noms d’entreprise déjà personnalisés restent enregistrés dans Firebase.

Build réussi. Tests navigateur connexion et parcours de location existant réussis, avec contrôle du responsive sur cinq largeurs. Vérification complémentaire sans JavaScript : logo initial chargé et titre LOKASYON LAKAY correct. Aucun déploiement Netlify effectué depuis cet environnement.

## Présentation bleu et or — 6 octobre 2026

Palette harmonisée avec le logo : bleu marine, bleu lumineux et accents dorés. Typographie locale Manrope pour les textes et Plus Jakarta Sans pour les titres, avec licences OFL incluses. Cartes, navigation, formulaires, connexion, super-admin et chargement harmonisés ; styles d’impression sobres préservés. Aucun changement aux opérations métier.

Build réussi. Parcours navigateur connexion, pro forma, location et super-admin réussis, incluant les vérifications sur cinq largeurs. Le premier passage super-admin a révélé un sélecteur de test ambigu dans une liste de plusieurs comptes ; il cible maintenant le compte recherché, puis le parcours complet a réussi. Vérifications supplémentaires : chargement effectif des deux polices locales et inspection du tableau de bord sur ordinateur et téléphone.

Publication du code sur GitHub ; le déploiement Netlify reste à effectuer ou à vérifier dans Netlify.

## Application installable — 6 octobre 2026

Manifeste PWA, icône du logo, métadonnées iOS, service worker et bouton « Installer l’application » ajoutés sur la connexion, dans le menu et dans les Paramètres. Le service worker de production conserve uniquement la page hors connexion et les icônes ; les données métier et requêtes Firebase restent sur le réseau.

Build réussi. Les parcours existants connexion et location/PDF ont réussi. Deux nouveaux tests PWA réussis : contrôle Chrome du manifeste et de l’installabilité sans erreur dans un profil normal, décodage de l’icône, activation du service worker, traitement simulé de la demande native, instructions accessibles sur cinq largeurs, écran hors connexion, reconnexion et masquage du bouton après événement d’installation. Le premier contrôle a identifié une icône PNG trop grande pour le sélecteur Chrome ; une représentation SVG intégrant le même PNG a corrigé la compatibilité. La navigation privée est exclue du contrôle d’installation, comme dans Chrome.

Installation finale sur un téléphone réel et domaine public à vérifier après déploiement Netlify. Le contrôle navigateur local ne constitue pas une installation effectuée sur l’appareil de l’utilisateur. Guide : INSTALLATION.md.

## Comptabilité en partie double — 6 octobre 2026

Ajout d’un espace réservé aux administrateurs : 27 comptes de départ, journal en centimes entiers, écritures manuelles équilibrées, import des factures et paiements par lots sans doublons, ajustements de factures, contrepassations conservant l’original, grand livre, balance, bilan et résultat, impression, CSV, clôtures mensuelles et historique. Les devises HTG et USD restent séparées. Les écritures et traces comptables sont protégées contre les écritures directes du navigateur.

- Compilation TypeScript/Vite réussie.
- 26 tests unitaires réussis, dont 6 sur les rapports comptables : résultat à la facture, cautions au passif, séparation des devises, soldes antérieurs, contrepassations et export CSV.
- 11 tests serveur réussis, dont 6 sur les montants exacts, les comptes actifs, les débits/crédits, les dates et les encaissements.
- 12 tests des règles Firestore réussis : lecture comptable réservée, refus des modifications directes du journal, des comptes, clôtures, imports, historique et compteur.
- Test d’intégration des fonctions comptables réussi : accès employé et autre organisation refusé, compte suspendu, plan idempotent, import et ajustements sans doublons, modification d’un paiement signalée, validation déséquilibrée refusée, demandes concurrentes idempotentes, contrepassation, clôture et réouverture.
- Parcours navigateur comptable réussi : initialisation, import des six pièces de démonstration, second import inchangé, saisie équilibrée, CSV réellement téléchargé, contrepassation, séparation HTG/USD, compte ajouté et neuf onglets contrôlés sur cinq largeurs.

Ces vérifications utilisent uniquement le projet fictif `demo-lokasyon`. Aucun déploiement Firebase ou Netlify de production n’a été effectué. Instructions de déploiement et limites fonctionnelles : COMPTABILITE.md.

Régression navigateur : connexion, pro forma/PDF/impression, installation PWA, parcours de location/paiement/retour et responsive réussis. Le test super-admin a révélé une navigation avant la fin de la connexion ; ajout d’une attente de la redirection authentifiée dans le test, puis parcours super-admin complet réussi. Aucun changement métier n’a été nécessaire pour cette correction de test.

## Mode hors connexion — 7 octobre 2026

Interface compilée disponible dans le service worker, cache persistant Firestore, organisation conservée par compte et file IndexedDB des saisies. La file est séparée par utilisateur et organisation, exportable, et synchronisée lorsque l’application est ouverte et le réseau retrouvé. Chaque mutation dispose d’un reçu immuable écrit dans la même transaction pour éviter une seconde application après perte de confirmation. Les modifications de fiches vérifient leur version initiale ; les locations, paiements et retours recontrôlent les contraintes métier au moment de la synchronisation.

- Compilation de production et compilation isolée `offline-test` réussies. Le build de production reste connecté à Firebase réel ; le build de test utilise uniquement `demo-lokasyon`.
- 27 tests unitaires réussis, dont comparaison stable des versions de documents.
- 13 tests des règles Firestore réussis, dont création personnelle des reçus, interdiction de modification/suppression, isolation et suspension.
- Parcours compilé avec service worker réussi : première sauvegarde des paramètres, redémarrage hors connexion, consultation des clients, conservation de cinq saisies locales (client, paiement, location, retour, pro forma), synchronisation automatique et conservation d’un conflit de stock. Rejeu du même paiement après confirmation perdue sans double encaissement ; reprise du conflit après restauration du stock.
- Les huit parcours navigateur ont réussi après ajustement de leurs attentes : comptabilité, connexion, hors connexion, pro forma/PDF/impression, deux contrôles PWA, super-admin et location/paiement/retour/PDF sur cinq largeurs.
- Le premier contrôle hors connexion a montré que `navigator.onLine` peut rester vrai après un redémarrage sans réseau. Le service worker signale maintenant le démarrage hors connexion et une vérification réseau indépendante confirme la reconnexion.
- Deux sélecteurs de tests ont été ajustés : état comptable ciblé dans son espace, label de sélection pro forma sans correspondance textuelle stricte. Le parcours de 80 chargements complets utilise le contenu DOM prêt et un délai adapté à l’initialisation du cache persistant.

La validation reste locale. Publier les nouvelles règles Firestore avant d’activer cette version sur Netlify : toutes les mutations utilisent désormais les reçus. Le code est livré dans une branche dédiée pour respecter cet ordre. Guide : HORS-CONNEXION.md. Les photos, l’administration de plateforme, la validation des écritures et les clôtures comptables nécessitent une connexion ; l’envoi lorsque l’application est fermée n’est pas garanti.
