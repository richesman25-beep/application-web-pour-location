# Comptabilité — LOKASYON LAKAY

Le menu **Comptabilité** est réservé aux administrateurs de l’entreprise. Il contient un plan de comptes, un journal en partie double, un grand livre, une balance, un bilan, un compte de résultat, les clôtures mensuelles et l’historique des opérations.

## Première utilisation

1. Ouvrez **Comptabilité → Initialiser le plan de comptes**. Les 27 comptes de départ couvrent clients, fournisseurs, caisse, banque, MonCash, NatCash, cautions, capital, matériel, salaires, taxes, amortissements et charges courantes.
2. Vérifiez les comptes avec votre comptable. Vous pouvez ajouter des comptes et modifier leurs intitulés. Le type d’un compte existant est fixe ; les comptes utilisés par les imports restent actifs.
3. Cliquez sur **Importer factures & paiements**. Les factures de location et les paiements sont parcourus par lots. Les pro forma sont exclus. Les pièces en erreur restent affichées pour correction.
4. Saisissez les soldes d’ouverture et les opérations hors location dans **Nouvelle écriture**. Choisissez la date, la devise, la référence du justificatif, le libellé et les comptes. Les modèles aident à saisir dépenses, fournisseurs, apports, transferts, remboursements de cautions et amortissements.
5. Sélectionnez HTG ou USD et les dates des rapports, puis imprimez ou exportez les tableaux CSV. Le dialogue d’impression du navigateur permet aussi d’enregistrer un PDF.

## Règles comptables

Les montants enregistrés dans le journal sont des centimes entiers. Le serveur exige un total débit égal au total crédit, des comptes actifs et une seule devise par écriture. Chaque ligne doit contenir un débit ou un crédit positif.

Une facture débite le compte **411 Clients** du total, crédite **706 Revenus des locations** du montant de location et **165 Cautions remboursables** de la caution facturée. Un paiement débite le compte de caisse, banque ou portefeuille correspondant et crédite **411 Clients**. Le moyen « Crédit » n’est pas un encaissement et ne s’importe pas comme tel.

Les produits du compte de résultat sont reconnus à la facture : ils peuvent donc différer des recettes encaissées du tableau de bord. Une caution facturée est au passif, même lorsqu’elle n’est pas encore encaissée. Son remboursement se saisit manuellement au journal avec un justificatif ; cette saisie ne modifie pas la location ni ses paiements.

HTG et USD restent séparés. Il n’y a pas de conversion automatique ni de bilan consolidé multidevise. Les charges, salaires, taxes, factures fournisseurs et immobilisations se saisissent par écritures ; le module ne calcule pas automatiquement la paie, les déclarations fiscales ou les amortissements, et ne se connecte pas aux banques. Ce plan de départ doit être adapté aux obligations de votre entreprise avec votre comptable.

## Imports et corrections

Répétez **Importer factures & paiements** après les nouvelles opérations de location. Il s’agit d’un import déclenché par l’administrateur, pas d’une synchronisation en arrière-plan. Réimporter une pièce inchangée ne crée pas de doublon. Une modification du montant de location ou de caution génère un ajustement daté du jour, sans remplacer l’écriture initiale.

Un paiement déjà comptabilisé dont les données changent est signalé pour contrôle : corrigez par une écriture justifiée. Les écritures manuelles ne se suppriment ni ne se modifient. Le bouton **Contrepasser** enregistre une nouvelle écriture inversée et conserve l’original. Les imports se corrigent par les ajustements des sources ou des écritures manuelles, sans contrepassation automatique des pièces importées.

Avant de commencer avec des données existantes, importez les pièces puis rapprochez-les avec les justificatifs et soldes réels. Ne ressaisissez pas manuellement les factures et paiements déjà importés.

## Clôtures et sécurité

Contrôlez les deux devises, les erreurs d’import et les soldes avant **Clôtures → Clôturer**. Une clôture mensuelle bloque les nouvelles écritures à une date de ce mois, y compris un premier import de factures anciennes. Une réouverture exige un motif et reste dans l’historique. La clôture ne produit pas automatiquement les écritures annuelles de report du résultat.

Les employés ne peuvent pas consulter la comptabilité. Les écritures, comptes, périodes, traces d’import, historique et compteur du journal ne peuvent pas être modifiés directement par le navigateur, même par un administrateur. Les fonctions serveur vérifient l’organisation, le rôle, les suspensions et le mode maintenance à chaque transaction. Le super-administrateur conserve son accès de lecture prévu par les règles de plateforme.

## Mise en ligne

Les nouveaux services doivent être déployés avec les règles avant utilisation sur le site public. Dans un terminal connecté à votre compte Firebase autorisé sur `mon-projet-ia-891e5` :

```bash
npm ci
npm ci --prefix functions
npm run build:server
npx firebase deploy --only functions,firestore:rules --project mon-projet-ia-891e5
```

Redéployez ensuite la dernière version de `main` sur Netlify, ou reconstruisez avec `npm run build` et publiez `dist`. L’installation des dépendances, la compilation et les tests locaux ne déploient pas Firebase. Les fonctions utilisent le même environnement Firebase Functions que l’administration de plateforme.

## Vérification locale

Démarrez les émulateurs et Vite comme indiqué dans le README, puis :

```bash
npm test
npm run test:server
npm run test:rules
node --test tests/rules/accounting-functions.test.mjs
npm run test:e2e -- tests/e2e/accounting.spec.ts
```

Les tests de règles réinitialisent les données des émulateurs : exécutez-les avant les parcours navigateur. Les tests comptables utilisent exclusivement `demo-lokasyon` et ne modifient pas votre projet réel.
