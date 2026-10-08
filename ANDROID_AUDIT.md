# Audit Android et Google Play — LOKASYON LAKAY

## Architecture conservée

| Couche | Projet existant | Préparation Android |
| --- | --- | --- |
| Interface | React 19, TypeScript, Vite 7, React Router 7, Tailwind 4 et CSS locaux | Même code, mêmes routes ; build `dist-android` distinct du build Web `dist` |
| Authentification | Firebase Auth Email/Mot de passe | Même projet Firebase ; session propre au WebView Android |
| Données | Firestore : `organizations/{org}`, clients, biens, locations, paiements, factures, pro forma, réglages | Modèle, calculs et transactions conservés |
| Administration/comptabilité | Fonctions Firebase, rôles, règles Firestore/Storage | Services inchangés ; déploiement nécessaire en production |
| Offline | Cache Firestore persistant multi-onglets et file IndexedDB ; reçus transactionnels et conflits | Assets embarqués ; première connexion en ligne ; pas de service worker dans Android |
| Documents | jsPDF, téléchargement Web | jsPDF 4.2.1 ; stockage cache/partage natif et dialogue d’impression Android conservés |
| Conteneur | Capacitor 7/API 35, APK debug | Capacitor 8/API 36, App/Filesystem/Network/Share, variantes debug/release/validation |

Les pages existantes restent disponibles : connexion, tableau de bord, clients, biens, catégories, locations, retours, paiements, factures, pro forma, comptabilité, paramètres, recherche et super-administration. Les quatre cartes statistiques, leurs calculs et leurs styles partagés ne sont pas modifiés par cette préparation.

## Changements ciblés

- SDK compile/cible 36, JDK 21, AGP 8.13.0 et Gradle 8.14.3 ; checksum officiel de la distribution Gradle enregistré.
- Minimum API 24, exigé par Capacitor 8. Le Web continue à fonctionner indépendamment de cette limite Android.
- Identifiant release `com.lokasyonlakay.app`, logo officiel, lancement système avec logo, nom LOKASYON LAKAY, version 1.1.0/code 2.
- Bouton Retour : dialogues et menu avant historique ; retour au tableau de bord sur une page directe ; minimisation aux racines. La session n’est pas effacée.
- Gestion native des zones système Android 16, redimensionnement du clavier et reprise du contrôle réseau au retour au premier plan.
- R8 et suppression des ressources inutilisées en release/validation ; règles de conservation des plugins réfléchis, dont l’impression.
- Trafic HTTP clair et contenu mixte désactivés, inspection WebView désactivée ; sauvegarde/restauration et transfert de données locales exclus explicitement.
- FileProvider limité à `cache/exports/`, sans accès général aux dossiers de stockage.
- Liens publics de confidentialité/suppression configurables avant et après connexion Android ; contrôle bloquant avant release, sans modifier l’authentification ou supprimer des données automatiquement.
- AdSense et ses métadonnées exclus **uniquement** des fichiers HTML Android. Le site conserve son fonctionnement.
- jsPDF mis à jour ; override ciblé de `@grpc/grpc-js` de Firestore vers une version corrigée de la même version majeure. Firebase n’est pas rétrogradé et ses services ne sont pas remplacés.

## Permissions du manifeste fusionné

| Permission | Usage |
| --- | --- |
| `android.permission.INTERNET` | Firebase et accès réseau |
| `android.permission.ACCESS_NETWORK_STATE` | Détection réseau native |
| `com.lokasyonlakay.app.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION` | Permission interne de niveau signature ajoutée par AndroidX pour protéger ses récepteurs |

Aucune permission caméra, localisation, contacts, microphone, notifications, lecture globale des médias, écriture globale du stockage ou identifiant publicitaire n’est demandée. Les images passent par le sélecteur du système. Partage et impression ne demandent pas de permission de stockage générale.

## Limites avant publication

- **Clé d’envoi absente** : vous avez choisi de la créer dans Android Studio. Le bundle livré est une **validation signée debug**, sous `com.lokasyonlakay.app.validation` ; le bundle release doit être signé ensuite avec votre clé.
- **Pages légales et suppression de compte à fournir** : leurs URL et un traitement effectif de suppression doivent exister. Ces changements n’ajoutent pas un service backend de suppression de données.
- **Firebase production** : aucune identité autorisée pour déployer dans le cloud. Vérifiez les fonctions, règles et méthodes Auth sur votre projet réel avant diffusion.
- **Android réel** : compilation/lint et contrôles d’archives/signatures vérifiés ; installation, bouton Retour physique, zones système, sélection de fichiers, partage et impression restent à valider sur un téléphone et via le rapport de pré-lancement Play.
- **16 Ko** : aucune bibliothèque native `.so` dans les artefacts actuels ; aucun alignement ELF applicatif à corriger. Refaire ce contrôle si un plugin natif contenant des `.so` est ajouté, et conserver la recette Play sur appareils 16 Ko.
- **Sécurité métier existante** : certaines transactions de location/paiement sont exécutées par le client Firebase et dépendent des règles. Les invariants financiers et les rôles restent ceux du projet ; la migration Android ne les durcit pas silencieusement. Voir les limites déjà documentées dans README.md.
- **Acceptation Google** : les déclarations Sécurité des données, accès contrôleur, confidentialité, suppression de compte, disponibilité des services et critères du compte développeur doivent être validés dans votre console. API 36 et une compilation correcte ne garantissent pas l’acceptation.

Les instructions de clé, génération du vrai AAB signé, tests internes et publication se trouvent dans [GOOGLE_PLAY.md](GOOGLE_PLAY.md). Voir [ANDROID_VALIDATION.md](ANDROID_VALIDATION.md) pour les résultats du contrôle effectué.
