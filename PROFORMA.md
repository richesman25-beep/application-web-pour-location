# Factures pro forma

Dans le menu **Pro forma**, choisissez **Nouvelle pro forma**. Sélectionnez le client et le bien, indiquez les dates en heure d’Haïti, le tarif convenu, la quantité, les frais, la caution et la date de validité. Enregistrez pour consulter le total calculé.

Le document possède un numéro PF-AAAA-00001. Les coordonnées de l’entreprise et du client sont conservées avec la proposition. Vous pouvez modifier une proposition ouverte, la marquer comme envoyée, l’annuler, l’imprimer au format A4 ou télécharger son PDF. « Envoyée » est un statut de suivi : aucun email n’est envoyé automatiquement.

Une pro forma ne réserve aucun stock, n’enregistre aucun paiement et ne compte pas dans les recettes. **Convertir en location** vérifie de nouveau le client et le stock, crée la location et la facture définitive, puis déduit le stock dans une même transaction Firebase. Le paiement se renseigne ensuite dans la location. Une seconde conversion renvoie la location existante. Une proposition annulée ou convertie ne peut plus être modifiée. Une proposition expirée doit être prolongée avant conversion.

## Mise en ligne

Redéployez Netlify depuis la branche main et publiez les règles Firestore mises à jour. Depuis un terminal connecté au bon projet Firebase :

```sh
npx firebase deploy --only firestore:rules --project mon-projet-ia-891e5
```

Il faut disposer des droits Firebase du projet. Sans ces règles, l’enregistrement des pro forma sera refusé. Le développement et les tests utilisent exclusivement le projet local demo-lokasyon.

## Vérification

```sh
npm test
npm run build
npm run test:rules
npm run test:e2e -- tests/e2e/proformas.spec.ts tests/e2e/workflow.spec.ts
```

Les tests de règles et de navigateur nécessitent les émulateurs Firebase démarrés avec `npm run emulators`, ainsi que le serveur Vite (`npm run dev`) pour le navigateur. Exécutez les règles avant le navigateur : elles réinitialisent les données locales.
