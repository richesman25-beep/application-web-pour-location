# Validation Android — 10 octobre 2026

| Contrôle | Résultat |
| --- | --- |
| Compilation Web React/TypeScript/Vite | Réussie, `dist` distinct d’Android |
| Compilation des assets Android et synchronisation Capacitor 8 | Réussies |
| Script `npm run android:validate` | Réussi ; AAB optimisé/signé de validation |
| Gradle `assembleDebug`, `bundleValidation`, `assembleValidation` | Réussis avec compile/target API 36 et minimum API 24 |
| Android `lintValidation` | Vérification du 8 octobre réussie (non rejouée intégralement le 9 ; lint vital de la compilation réussi) : **0 erreur**, 28 avertissements non bloquants sur ressources/icônes et vérification SDK obsolète ; pas de désactivation globale de lint |
| Signature APK | Vérifiée avec `apksigner`, signature v2 |
| Signature AAB validation | Vérifiée avec `jarsigner` ; certificat debug auto-signé, usage de validation uniquement |
| Manifeste fusionné | API 36/minimum 24, identifiant `.validation` pour le bundle, non debuggable, HTTP clair et sauvegarde désactivés |
| Archives APK/AAB | Intègres ; interface embarquée, plugins conservés, projet Firebase attendu, aucun `server.url` distant |
| Publicité Web | Script et métadonnées AdSense absents d’Android, conservés dans le Web |
| Bibliothèques natives | Aucune `.so` dans APK/AAB : pas de problème d’alignement ELF applicatif 16 Ko actuellement |
| Audit npm des dépendances de production | **0 vulnérabilité connue**, `npm audit --omit=dev`, après correction de jsPDF/gRPC |
| Tests unitaires | **36 réussis**, incluant navigation Android et validation des liens HTTPS |
| Tests de règles Firestore locaux | **16 réussis**, incluant isolation, suspensions et reçus de synchronisation |
| Parcours comptabilité, tableau de bord et saisie numérique | **3 réussis** dans le navigateur sur émulateurs Firebase |
| Parcours pro forma/PDF/impression/conversion/annulation | **Réussi** ; une première passe dépassait la limite de 60 secondes, reprise avec budget adapté et mêmes assertions |
| Facture allégée/PDF/impression/responsive | Vérification navigateur réussie ; contenu du PDF extrait et contrôlé après jsPDF 4.2.1 |
| Hors connexion, redémarrage, stockage local, synchronisation, doublons et conflits | **1 parcours complet réussi** sur une compilation offline de test et Firebase local |
| Garde de signature release sans clé | Refus attendu, avec instructions `GOOGLE_PLAY.md` ; aucune release signée implicitement avec la clé debug |

La variante validation reprend les optimisations release (R8 et suppression de ressources), mais possède son propre identifiant **`com.lokasyonlakay.app.validation`**. Elle ne constitue pas le bundle à publier dans la fiche Google Play de production.

Artefacts livrés :

- `downloads/LOKASYON-LAKAY-test.apk` — version 1.1.2/code 4, **9 516 757 octets**, clé debug locale, Android 7 ou plus récent. Contient les dernières améliorations d’interface, de facture et de saisie numérique.
- `downloads/LOKASYON-LAKAY-validation.aab` — version 1.1.1-validation/code 3, **6 351 535 octets**, clé debug, API 36. Ne s’installe pas directement et ne doit pas être utilisé comme release Play.
- Fichiers `.sha256` à côté des artefacts pour vérifier les téléchargements.

Non exécutés : installation et recette sur un téléphone/émulateur Android, contrôle réel des gestes/clavier/zones système, accès aux services Firebase de production, signature avec votre future clé d’envoi, test interne et rapport de pré-lancement Play. Les tests offline sont des tests navigateur sur émulateurs Firebase, pas des tests instrumentés Android. La clé de production et les pages publiques de confidentialité/suppression sont encore à fournir selon [GOOGLE_PLAY.md](GOOGLE_PLAY.md).

Corrections de sécurité du 9 octobre : mutations métier et photos privées côté serveur, purge locale protégée, dépendances actualisées. 15 tests backend et 2 parcours de confidentialité supplémentaires réussis. Les services et règles doivent être déployés suivant [SECURITY_MIGRATION.md](SECURITY_MIGRATION.md) ; ces fichiers Android ne les déploient pas.

Mise à jour APK du 10 octobre : version 1.1.2/code 4, confirmation email et récupération du mot de passe. Le nom du fichier de release reste `LOKASYON-LAKAY-test.3.apk`. Le bundle AAB de validation reste celui de la version 1.1.1 ; il n’a pas été reconstruit pour cette mise à jour APK.
