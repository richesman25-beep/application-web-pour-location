# Installer LOKASYON LAKAY

Après publication de la dernière version Netlify, ouvrez **https://creostore.it.com**. L’installation fonctionne sur un site servi en HTTPS. Pour les essais locaux, les navigateurs acceptent également localhost.

- **Android / Chrome** : cliquez sur **Installer l’application** depuis la connexion, le menu ou les Paramètres. Confirmez la demande du navigateur. Si elle n’apparaît pas, ouvrez le menu Chrome et choisissez **Installer l’application** ou **Ajouter à l’écran d’accueil**.
- **Ordinateur / Chrome ou Edge** : utilisez le même bouton ou l’icône d’installation dans la barre d’adresse. L’application s’ouvre ensuite dans sa propre fenêtre.
- **iPhone / iPad** : ouvrez le site dans **Safari**, puis **Partager → Sur l’écran d’accueil → Ajouter**. Activez **Ouvrir comme app** si cette option est proposée.

Le logo apparaît comme icône de l’application. Une connexion Internet reste nécessaire pour les clients, le stock, les locations, les paiements et les factures. Sans réseau, une page indique comment se reconnecter, avec un bouton **Réessayer**. Il ne s’agit pas d’un mode de gestion hors ligne.

## Fonctionnement technique

Le manifeste `public/manifest.webmanifest` définit le nom, le démarrage sur `/dashboard`, la fenêtre autonome et l’icône. L’icône SVG contient le PNG reproduit depuis le logo ; le PNG est également utilisé pour iOS. La session Firebase suit le stockage du navigateur utilisé pour l’installation : une nouvelle connexion peut être nécessaire, notamment sur iOS.

Le service worker `public/sw.js` est enregistré exclusivement dans la version de production. Il conserve uniquement la page hors connexion et les icônes publiques. Il ne met pas en cache les pages connectées, les réponses Firebase, les informations des clients ni les données financières. Les pages en ligne sont chargées depuis le réseau. Les en-têtes Netlify évitent le cache prolongé du service worker et du manifeste.

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
