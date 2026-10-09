# Audit de sécurité — LOKASYON LAKAY

9 octobre 2026. Audit du dépôt React 19/TypeScript/Vite, Firebase Auth/Firestore/Storage/Functions et Capacitor 8 Android API 36. Aucun AGENTS.md trouvé. Les instructions cloud ont été consultées. Essais exclusivement locaux, sur `demo-lokasyon` ; aucune donnée réelle modifiée, aucun déploiement. Les quatre cartes statistiques et les routes sont préservées.

## Failles confirmées et corrigées dans le code

### SEC-01 — Élevée : intégrité des locations, paiements et stocks

Avant correction, un membre actif pouvait écrire directement des documents métier et contourner les contrôles du formulaire : montants négatifs/incohérents, réécriture d’encaissements et manipulation du stock. Une sonde SDK locale et les tests de règles ont reproduit ces écritures acceptées. Le journal comptable était déjà protégé, mais ses sources pouvaient être altérées.

Correction : `functions/src/business.ts:15` effectue les mutations dans une transaction serveur autorisée ; `businessPolicy.ts` normalise les champs, les montants et les identifiants. Totaux, stocks, numéros et horodatages sont établis côté serveur. `business.ts:28` refuse les données historiques incohérentes. `firestore.rules:35` interdit toute écriture directe métier, même par un administrateur. Les services client soumettent les mêmes actions à `businessOperation`. Le seed de démonstration est réservé aux émulateurs.

Preuve reproductible : `tests/rules/business-functions.test.mjs` et `security.test.mjs` vérifient les appels sans identité, interentreprises, membres suspendus, montants invalides, paiements et locations concurrents. Aucun paiement réel n’est effectué. Un encaissement déclaré demeure une déclaration de l’utilisateur ; ces contrôles ne prouvent pas un virement bancaire.

### SEC-02 — Élevée : liens photos publics persistants

Les anciens liens Firebase avec jeton pouvaient rester accessibles après suspension. En outre, la lecture SDK des métadonnées d’un fichier sans jeton peut en créer un. Condition : connaissance du lien ou accès préalable au fichier.

Correction : `storage.rules:6` refuse tous les accès SDK directs. `functions/src/photos.ts:15` et `:22` servent des images après contrôle d’identité, entreprise et suspension, sans publier de jeton. Le client utilise `PrivateImage.tsx` et `photoService.ts`. Les anciens liens sont interprétés comme chemins privés, sans utiliser leur jeton. Le super-admin autorisé conserve son accès prévu.

Preuve : le test callable vérifie les refus anonyme/interentreprises/suspension et l’absence de jeton lors d’un upload. `tests/rules/photo-migration.test.mjs` démontre qu’un ancien lien public devient inutilisable sans supprimer le fichier. **Les anciens jetons de production restent à révoquer** avec le script documenté ; aucune migration réelle exécutée.

### SEC-03 — Moyenne : téléversement de contenu actif ou trompeur

Un membre pouvait téléverser un contenu SVG/HTML en exploitant des contrôles MIME insuffisants. Correction : signatures raster, décodage avec limite de pixels et réencodage JPEG supprimant les métadonnées dans `functions/src/photos.ts:13`. Taille limitée ; formats JPEG/PNG/WebP uniquement. Les tests refusent SVG et contenu falsifié. Les anciens objets non raster ne sont plus affichés ; leur inventaire reste à effectuer.

### SEC-04 — Élevée : reçus de synchronisation falsifiables

Un client autorisé pouvait auparavant fabriquer un reçu présenté comme une opération synchronisée. Correction : `firestore.rules:31` réserve ces reçus au serveur ; `functions/src/business.ts:15` lie le reçu à l’utilisateur et à une empreinte canonique de l’opération. Une répétition identique retourne le résultat sans doubler les écritures ; un identifiant réutilisé avec d’autres données est refusé. Vérifié par règles et tests métier locaux.

### SEC-05 — Dépendances vulnérables

Les dépendances et leurs verrous ont été actualisés, dont SDK Admin/Functions, Vitest, outils Firebase et sharp. Des overrides ciblés corrigent les dépendances transitives FTP/UUID/OpenTelemetry ; chokidar 4 remplace la chaîne vulnérable braces des outils Firebase. Les API utilisées et un événement watch local ont été vérifiés. Aucun appel PubSub/FTP réel testé. `npm audit` complet : **0 vulnérabilité signalée** dans le projet et Functions lors du contrôle. Cela ne couvre pas les vulnérabilités inconnues ou le système Android.

## Protections vérifiées et améliorations

L’isolation Firestore, la création de l’entreprise propriétaire, l’absence d’auto-attribution super-admin, les suspensions et les autorisations comptables sont testées localement. Les opérations sensibles de comptabilité et super-administration disposent déjà de contrôles backend ; elles ont été conservées. Les règles de bootstrap ne donnent pas de rôle global.

Le cache Firestore et la file IndexedDB sont nécessaires au hors connexion. `localPrivacyService.ts` offre une purge volontaire, refuse toute perte de saisie non synchronisée et retire les reçus locaux synchronisés de plus de 30 jours. La commande est disponible dans Paramètres et dans la file de synchronisation pour les collaborateurs. Le cache n’est pas chiffré par l’application ; utiliser un appareil et un compte système protégés. Une suspension distante ne peut effacer des données déjà présentes sur un appareil hors ligne.

En-têtes ajoutés : nosniff, SAMEORIGIN, referrer-policy et limitation caméra/microphone/géolocalisation sur Firebase Hosting/Netlify. Pas de CSP imposée sans tester AdSense et Firebase en staging. Le rendu React n’a pas révélé d’injection HTML non contrôlée dans le périmètre examiné ; ce constat ne prouve pas l’absence de toute XSS.

Android : API 36, pas de HTTP clair/mixed content, débogage WebView et sauvegarde désactivés en validation/release, FileProvider limité aux exports cache. APK et AAB de validation reconstruits avec la nouvelle interface. La clé debug ne remplace pas une clé Google Play.

La configuration Firebase Web (apiKey, projectId, appId) est publique, pas une clé serveur. La recherche antérieure sur l’historique local disponible et les sources n’a pas détecté de secret correspondant aux signatures recherchées ; aucun secret n’a été affiché. Cette recherche ne couvre pas les historiques distants supprimés, IAM ou secrets externes.

## Vérifications

- Web TypeScript/Vite : compilation réussie.
- Tests unitaires frontend : 36 réussis ; backend : 15 réussis.
- Règles Firebase : 16 réussis.
- Intégrations Functions locales : administration 1, comptabilité 1, métier/photos 2, migration photos 1 réussies.
- Parcours navigateur existants : workflow/pro forma 2, comptabilité/offline 2 réussis.
- Photos privées, PDF avec logo, purge et conservation des saisies offline : 2 tests navigateur réussis. Le timeout initial de fermeture Playwright a été résolu en attendant la récupération complète du téléchargement PDF.
- APK debug et bundle de validation : compilations et signatures vérifiées. Voir ANDROID_VALIDATION.md pour les limites.

Reproduction : `npm test`, `npm run test:server`, puis lancer les émulateurs et exécuter `npm run test:rules`, `node --test tests/rules/business-functions.test.mjs`, `node --test tests/rules/photo-migration.test.mjs`. Exécuter les suites Firebase successivement : certaines réinitialisent leurs fixtures locales. Les tests navigateur utilisent le serveur Vite configuré pour les émulateurs.

## Non vérifié / mise en service restante

La CLI Firebase n’est pas authentifiée : aucun déploiement possible dans cette session. Les règles actuellement publiées, IAM/ACL Storage, App Check, MFA, restrictions de clé, quotas et sauvegardes réelles n’ont pas été contrôlés. Les incohérences historiques doivent être examinées, pas réparées arbitrairement. Les anciens APK doivent être mis à jour avant fermeture des écritures SDK.

Pas de test instrumenté sur appareil Android, signature Play de production ou publication de release GitHub. Suivre **SECURITY_MIGRATION.md** avant mise en service. Ce rapport ne constitue pas une certification de sécurité.
