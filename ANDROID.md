# APK Android — LOKASYON LAKAY

Cette version de test utilise Capacitor 7 et embarque l’interface compilée de LOKASYON LAKAY. Elle utilise le projet Firebase réel `mon-projet-ia-891e5`. Elle ne charge pas simplement une URL Netlify : l’interface reste disponible sur l’appareil, avec la file hors connexion de cette branche.

## Installation

Téléchargez `downloads/LOKASYON-LAKAY-test.apk` sur votre téléphone Android, ouvrez le fichier et autorisez l’installation depuis ce navigateur si Android le demande. L’APK de test est signé et installable directement ; il n’est pas publié sur Google Play. Le projet définit Android 6 / API 23 comme version minimale. Une version récente d’Android System WebView est nécessaire.

Connectez-vous avec le compte Firebase utilisé sur le site. La session et les saisies locales sont distinctes de celles du navigateur. Une première connexion avec Internet est nécessaire avant la consultation hors connexion. Les données déjà synchronisées restent dans Firebase ; les saisies en attente sont propres à cet appareil.

## Firebase nécessaire avant les opérations métier

L’APK ne déploie pas Firebase. Depuis le dossier de cette version du projet, sur un ordinateur connecté au compte Google autorisé :

```bash
npm ci
npm ci --prefix functions
npx firebase login
npx firebase deploy --only functions,firestore:rules --project mon-projet-ia-891e5
```

Les règles de cette branche incluent les reçus `offlineOperations`. Elles sont nécessaires aux enregistrements et à la synchronisation. Les fonctions comptables sont nécessaires pour initialiser le plan de comptes, les écritures, les imports et les clôtures. Voir COMPTABILITE.md et HORS-CONNEXION.md.

## Documents et interface Android

Le logo fourni apparaît comme icône et écran de lancement. L’impression utilise le dialogue Android, qui permet d’imprimer ou d’enregistrer un PDF selon les services installés. Les PDF de factures/pro forma, CSV et sauvegardes JSON sont écrits dans le cache de l’application puis proposés dans le dialogue Android d’enregistrement/partage. La collecte des photos utilise le sélecteur de fichiers du WebView.

Les scripts AdSense de la page Web sont exclus du build Android ; la version Web les conserve. Le bouton d’installation PWA est masqué dans l’APK déjà installé. Les fichiers de l’application sont embarqués : le service worker Web n’est pas utilisé dans l’APK. La connexion native et une requête réseau extérieure servent à détecter le retour du réseau.

## Recompiler

Prérequis : Node.js 22 ou 24, JDK 21 complet, Android Studio / Android SDK 35 avec Build Tools 34 et 35, licences SDK acceptées.

```bash
npm ci
npm run build:android
```

Puis dans le dossier `android` :

```bash
./gradlew assembleDebug
```

Sur Windows, utilisez `gradlew.bat assembleDebug`. Le résultat se trouve dans `android/app/build/outputs/apk/debug/app-debug.apk`. `npm run android:open` ouvre le projet dans Android Studio.

La clé de test n’est pas dans Git. Pour une distribution durable et des mises à jour compatibles, préparez et conservez votre propre clé de signature avec Android Studio. Une nouvelle signature peut nécessiter de désinstaller l’ancienne version : synchronisez ou sauvegardez les saisies locales avant toute désinstallation. La publication Google Play et une signature de production ne font pas partie de cet APK de test.

## Vérifications

La compilation Android et les contrôles de signature/contenu de l’APK sont vérifiés dans l’environnement cloud. Les tests unitaires et les parcours navigateur de comptabilité, pro forma/PDF et installation PWA vérifient que les adaptations Android préservent la version Web. L’installation, les autorisations, le choix du fichier, le partage et l’impression sur un vrai téléphone restent à tester ; aucune installation distante sur votre téléphone n’a été effectuée.
