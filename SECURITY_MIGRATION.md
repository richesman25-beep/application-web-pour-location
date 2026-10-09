# Mise en service des corrections

Le code est corrigé ; aucune commande ci-dessous n’a été exécutée en production. La CLI Firebase de cette session ne dispose pas d’une identité autorisée.

1. Sauvegarder les données, vérifier la restauration et tester sur un projet staging. Installer Node 22.12+ et les dépendances verrouillées (`npm ci`, `npm --prefix functions ci`).
2. Avec une identité autorisée, contrôler les données sans écriture :
   ```sh
   node scripts/audit-financial-data.mjs --project mon-projet-ia-891e5 --production-read-only
   ```
   Examiner les anomalies avec le responsable comptable. Ce script ne prouve pas la réalité des paiements. Ne pas modifier les anciens montants automatiquement.
3. Tester et déployer les nouvelles Functions `businessOperation`, `uploadPrivatePhoto`, `readPrivatePhoto` avec les fonctions existantes. Vérifier le bucket configuré, la région, les droits du compte serveur et les conditions de facturation requises pour Functions. Authentification : `firebase login` sur votre poste ; ne pas transmettre de clé privée dans le chat.
4. Publier le Web et distribuer l’APK mis à jour. Remplacer le fichier de release GitHub utilisé par le bouton Android. Les anciens clients écrivent directement : ils ne fonctionneront plus après fermeture des règles. Organiser cette mise à jour avant de déployer les règles Firestore/Storage préparées. Aucun ancien APK n’a été mis à jour à distance.
5. En staging puis durant la mise en service coordonnée :
   ```sh
   npm run build:server
   firebase deploy --project mon-projet-ia-891e5 --only functions
   firebase deploy --project mon-projet-ia-891e5 --only firestore:rules,storage
   ```
   Publier les ressources web par le canal habituel Firebase Hosting ou Netlify ; aucun déploiement n’a été fait ici. Vérifier les nouveaux clients, réservations concurrentes, paiements, PDF, photos et synchronisation avant ouverture générale.
6. Les reçus historiques créés par l’ancien client n’ont pas d’empreinte serveur : ils ne peuvent pas être rejoués comme nouveaux reçus fiables. Réconcilier les opérations en attente avec les documents déjà enregistrés, sans supprimer aveuglément une file locale ou réencaisser une opération.
7. Les anciens liens de photo sont automatiquement interprétés comme chemins privés. Révoquer néanmoins les jetons historiques, d’abord en simulation :
   ```sh
   node scripts/revoke-photo-tokens.mjs --project mon-projet-ia-891e5 --bucket mon-projet-ia-891e5.firebasestorage.app
   ```
   Examiner les compteurs, puis appliquer explicitement :
   ```sh
   node scripts/revoke-photo-tokens.mjs --project mon-projet-ia-891e5 --bucket mon-projet-ia-891e5.firebasestorage.app --apply
   ```
   Le script conserve les images et supprime les jetons publics. Vérifié sur émulateur ; la branche production utilisant les métadonnées GCS doit être validée en staging. Vérifier aussi IAM/ACL et Public Access Prevention du bucket : les règles Firebase ne contrôlent pas les accès publics GCS. Inventorier les anciens SVG ou fichiers incompatibles et les remplacer sous contrôle de l’opérateur.
8. Sur appareil partagé : fermer les autres onglets et utiliser l’effacement local dans Paramètres ou la file de synchronisation. Une saisie non synchronisée bloque l’effacement. Les opérations synchronisées de plus de 30 jours sont retirées de la file ; les autres caches restent jusqu’à purge. Aucune révocation distante ne garantit l’effacement d’un appareil hors ligne.
9. Surveiller les refus serveur, erreurs photo, coûts/latence et conflits. Tester séparément les politiques MFA/App Check/CSP avant de les imposer. Ne pas réouvrir les écritures métier pour contourner une erreur.

Les fichiers APK/AAB de `downloads` sont signés pour test/validation. Créer la clé d’envoi Google Play dans Android Studio suivant GOOGLE_PLAY.md ; ne jamais publier une clé privée. La compatibilité et les gestes Android doivent encore être testés sur appareil.
