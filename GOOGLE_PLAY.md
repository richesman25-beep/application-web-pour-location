# LOKASYON LAKAY — préparation Google Play

Le site Web continue à se compiler avec `npm run build` vers `dist`. Android embarque une compilation séparée dans `dist-android`, utilise les mêmes services Firebase et conserve les routes et fonctionnalités. Il ne charge pas le site Netlify dans une fenêtre distante. Voir [ANDROID_AUDIT.md](ANDROID_AUDIT.md) pour l’architecture et les limites vérifiées.

## 1. Outils et identité

- Node.js 22 ou 24, JDK **21 complet**, Android Studio récent compatible avec Android Gradle Plugin 8.13.
- SDK Platform **Android 16 / API 36**, Build Tools **36.0.0**, Platform Tools ; licences SDK acceptées.
- Capacitor **8**, Gradle **8.14.3**, AGP **8.13.0**.
- Nom : **LOKASYON LAKAY**. Identifiant release : **`com.lokasyonlakay.app`**.
- Android minimal : **7 / API 24** avec un WebView à jour. La précédente version Capacitor 7 acceptait API 23 ; Capacitor 8 exige API 24.
- `versionName` **1.1.0**, `versionCode` **2** dans `android/app/build.gradle`. Augmentez `versionCode` à chaque envoi Play ; il doit dépasser tous les codes déjà utilisés dans votre console.
- Logo officiel conservé dans les icônes mipmap/adaptatives et l’écran de lancement. Le nom et l’identifiant sont configurés dans Capacitor et Android.

Dans Android Studio → **Tools → SDK Manager**, installez ces composants. Sélectionnez le JDK 21 dans **Settings → Build, Execution, Deployment → Build Tools → Gradle**. `npm run android:open` ouvre le projet Android.

## 2. Préparer le projet

```bash
npm ci
npm run build:android
npm run android:open
```

En dehors d’Android Studio, `JAVA_HOME` doit pointer vers le JDK 21 et `ANDROID_HOME` vers votre SDK. Vous pouvez aussi configurer le SDK avec `android/local.properties` (`sdk.dir=...`), fichier local exclu de Git. Sous Windows, utilisez des chemins correctement échappés ou des barres `/`.

Le build Android utilise Firebase réel `mon-projet-ia-891e5`. Vérifiez que Email/Mot de passe, Firestore et Storage sont configurés et que les fonctions métier et les règles de cette branche sont déployées. Aucun compte de service n’est embarqué. La configuration Firebase Web est publique et la protection des données repose sur les règles et l’authentification.

L’environnement cloud ne dispose pas d’un compte Firebase autorisé pour déployer. Depuis votre ordinateur autorisé, si ce déploiement reste à faire :

```bash
npm ci --prefix functions
npx firebase login
npx firebase deploy --only functions,firestore:rules,storage --project mon-projet-ia-891e5
```

Consultez [COMPTABILITE.md](COMPTABILITE.md), [SUPERADMIN.md](SUPERADMIN.md) et [HORS-CONNEXION.md](HORS-CONNEXION.md). Ne publiez pas une version dans laquelle la comptabilité, les enregistrements ou les règles de synchronisation sont indisponibles.

## 3. Tester un APK

```bash
npm run android:apk
```

Résultat : `android/app/build/outputs/apk/debug/app-debug.apk`. Vous pouvez installer cet APK avec Android Studio ou :

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

La clé debug est locale. Une signature différente de celle d’un APK précédemment installé empêche sa mise à jour ; synchronisez ou sauvegardez les saisies locales avant toute désinstallation.

Pour vérifier l’optimisation release sans votre clé de publication :

```bash
npm run android:validate
```

Résultat : `android/app/build/outputs/bundle/validation/app-validation.aab`. Cette variante est signée avec une **clé de test**, porte l’identifiant **`com.lokasyonlakay.app.validation`** et le nom « LOKASYON LAKAY · validation ». **Ne l’envoyez pas comme version de production dans Google Play.** Un AAB ne s’installe pas directement ; utilisez un APK pour les tests locaux ou `bundletool` pour produire des APK à partir du bundle.

## 4. Créer votre clé d’envoi dans Android Studio

Vous avez indiqué ne pas avoir de clé d’envoi. Créez-la sur votre ordinateur afin de pouvoir la conserver durablement.

1. Compilez les fichiers Web avec `npm run build:android`, puis ouvrez le projet Android.
2. **Build → Generate Signed App Bundle / APK**.
3. Choisissez **Android App Bundle**, module **app**, puis **Create new…**.
4. Enregistrez `lokasyon-upload.jks` dans un dossier privé **hors du dépôt**, par exemple `Documents/cles-lokasyon/`.
5. Choisissez des mots de passe forts, alias **`lokasyon-upload`**, validité **au moins 25 ans**, puis remplissez les renseignements du certificat avec vos informations.
6. Sauvegardez le fichier `.jks` et les mots de passe dans deux emplacements sûrs. Aucun mot de passe ni clé privée ne doit être placé sur GitHub ou envoyé dans le chat.
7. Copiez `android/keystore.properties.example` vers **`android/keystore.properties`**, puis renseignez le chemin du fichier, l’alias et les deux mots de passe **localement**. Utilisez `/` dans le chemin, y compris sous Windows. Ce fichier et les keystores sont exclus de Git.

Pour une CI privée, les équivalents sont `LOKASYON_UPLOAD_STORE_FILE`, `LOKASYON_UPLOAD_STORE_PASSWORD`, `LOKASYON_UPLOAD_KEY_ALIAS` et `LOKASYON_UPLOAD_KEY_PASSWORD`, fournis par son gestionnaire de secrets. Ne les ajoutez pas à des variables `VITE_*`, qui sont publiques dans l’application.

Dans Play Console, activez **Play App Signing** : Google conserve la clé de signature des APK distribués ; votre clé d’envoi signe les AAB transmis. Suivez la procédure officielle de récupération si une clé d’envoi est perdue. Ne remplacez pas arbitrairement la clé d’une application déjà publiée.

## 5. Confidentialité et suppression de compte : prérequis de publication

L’application permet de créer des comptes et traite des données clients et comptables. Avant publication, fournissez deux pages Web publiques **HTTPS**, accessibles sans connexion :

- Une politique de confidentialité réelle : responsable et contact, données collectées, finalités, services Firebase, partage, sécurité, durée de conservation et droits des utilisateurs.
- Une page permettant effectivement de **demander la suppression du compte et des données associées**. Expliquez comment la demande est vérifiée, les délais de traitement, les données supprimées et les éventuelles obligations de conservation comptable. Une page vide ou un simple lien non traité ne suffit pas.

Copiez `.env.android.example` vers **`.env.android.local`** et remplacez les exemples :

```dotenv
VITE_PRIVACY_POLICY_URL=https://votre-domaine/politique-confidentialite
VITE_ACCOUNT_DELETION_URL=https://votre-domaine/suppression-compte
```

Ces liens sont affichés dans l’application Android **avant connexion et dans son menu**. Aucun compte n’est supprimé automatiquement par ce changement ; le processus de suppression doit être opérationnel côté service. Ne supprimez pas des factures ou des données d’autres membres sans avoir défini les obligations de conservation et les droits concernés.

Le build release refuse une clé absente, l’alias debug ou des liens HTTPS absents/d’exemple. Ce contrôle ne prouve pas le contenu des pages ni leur accessibilité : vous devez les tester et traiter les demandes. La variante validation reste compilable avant ces étapes.

## 6. Générer le vrai AAB signé

Après configuration de votre clé et de vos pages publiques :

```bash
npm run android:bundle
```

Résultat : **`android/app/build/outputs/bundle/release/app-release.aab`**. Le script recompile les fichiers Android et synchronise Capacitor avant Gradle. Depuis Android Studio, choisissez la variante **release** dans le dialogue de génération signé, après la même préparation.

Contrôlez le certificat avec :

```bash
jarsigner -verify -verbose -certs android/app/build/outputs/bundle/release/app-release.aab
```

Le certificat doit correspondre à votre clé d’envoi. Le certificat d’envoi est auto-signé : un avertissement sur la chaîne de confiance ne remplace pas la vérification de la signature et de l’empreinte attendue.

## 7. Recette Android avant publication

Testez sur Android **7/24**, **15/35**, **16/36**, un téléphone physique, une tablette et un écran étroit ; utilisez gestes système et navigation à trois boutons.

1. Icône, lancement à froid, reprise après passage en arrière-plan, rotation et absence de contenu sous les barres système.
2. Inscription/connexion Firebase réelle, reconnexion et déconnexion. Même compte et données métier que sur le Web ; le cache et la file locale sont propres à chaque appareil.
3. Menu, cinq rubriques mobiles et bouton Retour : fermer d’abord un dialogue/menu, revenir à la page précédente, puis minimiser aux pages racines sans effacer la session.
4. Champs numériques : effacer zéro, saisir `12`, décimales, tarif automatique ; clavier ne masquant pas les champs et les actions.
5. Clients, biens, locations, paiements, retours, pro forma, comptabilité et droits administrateur/super-administrateur selon le compte.
6. Sélection d’images, export PDF/CSV/JSON, dialogue de partage Android, impression et enregistrement PDF. Les fichiers partagés proviennent uniquement du cache `exports/`.
7. Hors connexion **après une première connexion et lecture en ligne** : redémarrer, consulter les données déjà mises en cache, enregistrer une saisie, rouvrir, reconnecter et vérifier la synchronisation sans doublon. Vérifier aussi un conflit de stock. La comptabilité, l’administration et l’envoi de photos restent en ligne.
8. Politique de confidentialité, demande de suppression et traitement réel de la demande.
9. **Test interne Play** avec le vrai AAB, rapport de pré-lancement, crashs/ANR, appareils avec pages mémoire de 16 Ko si des bibliothèques natives sont ajoutées.

L’authentification initiale n’est pas disponible hors connexion. Ne présentez pas le mode offline comme une nouvelle connexion sans réseau. Les opérations en file restent provisoires jusqu’à validation Firebase. La détection réseau native utilise aussi une requête au manifeste du site Netlify existant ; vérifiez ce domaine dans votre recette.

## 8. Publication dans Play Console

1. Créez l’application et vérifiez que `com.lokasyonlakay.app` n’est pas déjà attribué à une autre application. L’identifiant est durable après publication.
2. Complétez la fiche : nom, description, icône **512 × 512**, illustration de présentation **1024 × 500**, captures téléphone/tablette, catégorie et contact de support réel.
3. Complétez **Sécurité des données**, politique de confidentialité, suppression de compte, classification du contenu, public cible et accès à l’application. Déclarez les pratiques réelles ; Firebase seul ne fournit pas une réponse universelle au questionnaire.
4. Donnez au contrôleur Google un compte de démonstration fonctionnel et les instructions d’accès aux fonctions protégées, sans données personnelles réelles.
5. Déclarez la publicité selon ce qui est réellement intégré à Android : les scripts et métadonnées AdSense Web sont exclus de la compilation Android. Ne déclarez pas AdMob, publicités Android ou achats intégrés si vous ne les avez pas ajoutés.
6. Activez Play App Signing, envoyez **`app-release.aab`** dans **Tests → Test interne**, corrigez les problèmes du rapport de pré-lancement.
7. Suivez les exigences de test fermé/vérification affichées pour votre type et date de création de compte développeur ; vérifiez la règle SDK cible en vigueur dans la console.
8. Après recette et conformité, créez une version de production et soumettez-la à Google. L’acceptation relève de Google, elle n’est pas garantie par une compilation.

Pour une mise à jour : conservez l’identifiant et la clé d’envoi, augmentez `versionCode`, modifiez `versionName`, reconstruisez et transmettez un nouvel AAB via les mêmes étapes. Testez aussi une mise à jour sans désinstallation afin de vérifier la conservation de la session et des saisies locales.

Références officielles : [SDK cible](https://support.google.com/googleplay/android-developer/answer/11926878), [Play App Signing](https://developer.android.com/studio/publish/app-signing), [suppression de compte](https://support.google.com/googleplay/android-developer/answer/13327111), [pages mémoire de 16 Ko](https://developer.android.com/guide/practices/page-sizes), [Sécurité des données](https://support.google.com/googleplay/android-developer/answer/10787469).
