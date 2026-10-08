# Installer LOKASYON LAKAY

Après publication de la dernière version Netlify, ouvrez **https://creostore.it.com**. L’installation fonctionne sur un site servi en HTTPS. Pour les essais locaux, les navigateurs acceptent également localhost.

- **Android / Chrome** : cliquez sur **Installer l’application** depuis la connexion, le menu ou les Paramètres. Confirmez la demande du navigateur. Si elle n’apparaît pas, ouvrez le menu Chrome et choisissez **Installer l’application** ou **Ajouter à l’écran d’accueil**.
- **Ordinateur / Chrome ou Edge** : utilisez le même bouton ou l’icône d’installation dans la barre d’adresse. L’application s’ouvre ensuite dans sa propre fenêtre.
- **iPhone / iPad** : ouvrez le site dans **Safari**, puis **Partager → Sur l’écran d’accueil → Ajouter**. Activez **Ouvrir comme app** si cette option est proposée.

Le logo apparaît comme icône de l’application. Après une première connexion sur cet appareil, les données déjà chargées sont consultables sans réseau. Les saisies restent dans une file locale et sont envoyées à Firebase à la reconnexion, lorsque l’application est ouverte. Voir [HORS-CONNEXION.md](HORS-CONNEXION.md).

## Fonctionnement technique

Le manifeste `public/manifest.webmanifest` définit le nom, le démarrage sur `/dashboard`, la fenêtre autonome et l’icône. L’icône SVG contient le PNG reproduit depuis le logo ; le PNG est également utilisé pour iOS. La session Firebase suit le stockage du navigateur utilisé pour l’installation : une nouvelle connexion peut être nécessaire, notamment sur iOS.

Le service worker `public/sw.js` conserve l’interface compilée, ses modules, polices et images publiques. Il ne conserve pas les réponses Firebase dans le cache HTTP. Les données déjà chargées sont conservées séparément par Firestore dans IndexedDB ; les saisies en attente ont leur propre file locale. Les en-têtes Netlify évitent le cache prolongé du service worker et du manifeste. Une nouvelle version s’active une fois les anciennes fenêtres fermées, afin de conserver des modules cohérents pendant une session.

## Vérification locale

```sh
npm run build
npm run preview
```

Dans un autre terminal, lancez :

```sh
npm run test:e2e -- tests/e2e/pwa.spec.ts
```

Le test production utilise le serveur de prévisualisation sur le port 4173 ; les tests des instructions utilisent le serveur de développement sur le port 5173 (`npm run dev`). Le contrôle Chrome utilise un profil normal temporaire, car l’installation est bloquée en navigation privée.

Ces contrôles vérifient le manifeste, l’icône, les critères d’installation Chromium, le service worker, l’interface d’installation, le repli hors connexion, le retour en ligne et les tailles d’écran. L’installation finale sur un vrai téléphone doit être essayée après déploiement. Aucune publication dans Google Play ou l’App Store n’est nécessaire.
