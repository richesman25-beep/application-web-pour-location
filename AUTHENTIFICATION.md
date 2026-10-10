# Confirmation email, récupération et maintenance

## Fonctionnement

À l’inscription, Firebase envoie un lien de confirmation en français. Le compte reste sur l’écran de validation jusqu’à confirmation. Les boutons permettent de renvoyer l’email, de vérifier la confirmation et de se déconnecter. L’entreprise est créée après validation. Les données des comptes existants ne sont pas supprimées ; les titulaires non vérifiés doivent également confirmer leur adresse.

Sur la connexion, « Mot de passe oublié ? » demande l’email et envoie le lien Firebase. La réponse ne révèle pas si un compte existe. Le formulaire de remplacement du mot de passe et la consommation du lien sont gérés par Firebase ; aucun mot de passe ne passe par nos fonctions.

Les règles Firestore exigent un jeton dont `email_verified` est vrai. Les fonctions métier, photos, comptabilité et super-admin consultent également le statut Firebase Auth réel. Une confirmation nécessite une actualisation du jeton ; le bouton « J’ai confirmé mon email » le fait puis recharge l’application. Hors connexion, cette confirmation initiale nécessite le réseau.

## Firebase — configuration à vérifier

Dans Authentication → Méthode de connexion : activer Email/Mot de passe.
Dans Authentication → Modèles : vérifier « Validation de l’adresse e-mail » et « Réinitialisation du mot de passe », nom d’expéditeur et lien d’action. Les appels du client demandent le français. Les liens utilisent le gestionnaire Firebase par défaut : ne pas mettre une URL Android localhost comme gestionnaire. Tester la délivrabilité réelle et les courriers indésirables avec votre adresse.

Vérifier les domaines autorisés du site et activer la protection contre l’énumération des emails dans les paramètres Firebase/Identity Platform. Le message générique de récupération ne remplace pas cette protection du service.

Les émulateurs enregistrent les liens de test sans envoyer de vrai mail. Les tests locaux consomment uniquement leurs codes ; aucune vérification de livraison réelle n’est revendiquée.

## Mode maintenance

Console super-admin → Vue globale → « Mettre le site en maintenance ». Une confirmation est requise. Fournir au préalable l’email de support dans « Paramètres du site » ; y saisir aussi le message de maintenance. « Remettre le site en ligne » désactive le mode.

Seul un super-administrateur actif peut modifier ce paramètre via `adminSetSite`. Sa console `/super-admin` reste accessible ; l’accès ordinaire et les mutations métier/comptables sont bloqués côté serveur. La synchronisation automatique est suspendue. Les saisies locales ne sont pas supprimées. Un appareil hors réseau ne peut connaître instantanément la maintenance : les appels seront contrôlés à la reconnexion.

Il faut un compte vérifié et un rôle attribué par un serveur de confiance dans `superAdmins/{uid}`. Ne jamais permettre à un utilisateur de s’accorder ce rôle depuis l’interface.

## Publication

Le web et les fonctions/règles doivent être déployés ensemble suivant SECURITY_MIGRATION.md. Prévenir les utilisateurs existants non vérifiés. Tester d’abord en staging et organiser les nouveaux clients avant les nouvelles règles. Les APK déjà publiés ne reçoivent pas ce nouvel écran par une mise à jour du site : reconstruire et distribuer une nouvelle version Android pour bénéficier du parcours complet.

Aucun déploiement Firebase ni envoi réel d’email effectué pendant les tests de développement.
