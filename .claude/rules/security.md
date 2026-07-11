---
paths:
  - "src/**"
  - "app/**"
---

# Security Rules — Manbaa

## Auth

- JWT via httpOnly cookie uniquement — jamais localStorage, jamais sessionStorage
- Ne jamais créer un deuxième système d'authentification
- Ne jamais désactiver l'auth pour faire passer des tests
- Les bypasses de développement doivent être explicites et absents en production

## Multi-tenant

- Toujours inclure organization_id et workspace_id dans les requêtes scoped
- Les route guards sont des contrôles UX — pas des contrôles de sécurité
- Ne jamais se fier au frontend pour enforcer l'autorisation
- Ne jamais mixer des données de workspaces différents

## Données sensibles

- Ne jamais exposer de secrets dans les logs, le rendu, les URL params
- Ne jamais logger les access tokens ou refresh tokens
- Ne jamais afficher de stack traces brutes à l'utilisateur
- Utiliser des messages d'erreur génériques côté user pour les erreurs 5xx

## Inputs non fiables

- Traiter les fichiers uploadés comme non fiables
- Traiter les réponses des workers IA comme non fiables
- Valider avec Zod avant d'utiliser dans le state
- Sanitizer le contenu user-controlled avant rendu HTML

## Commandes dangereuses — ne jamais exécuter

- `rm -rf` sans confirmation explicite
- `git push --force`
- `git reset --hard`
- Toute commande ciblant un environnement de production
