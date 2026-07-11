---
paths:
  - "src/**/*.{ts,tsx}"
  - "app/**/*.{ts,tsx}"
---

# Règles Frontend — Manbaa

## Composants

- Inspecter les composants existants avant d'en créer un nouveau
- Garder l'orchestration API hors des composants présentationnels
- Séparer logique métier et rendu dans les composants complexes
- Tout composant interactif doit supporter :
  - navigation clavier
  - focus visible
  - état disabled
  - état loading
  - état error si applicable
  - labeling accessible (aria)
- Ne jamais implémenter un `div` cliquable quand un `button` ou `a` est approprié
- Taille minimale des touch targets : 44×44px

## State management

- TanStack Query → données serveur uniquement
- Zustand → état UI et état éditeur uniquement
- React Hook Form → formulaires uniquement
- URL search params → filtres partageables, pagination, onglets
- React local state → état éphémère composant
- Ne jamais tout mettre dans un seul store global

## TypeScript

- `strict: true` obligatoire
- Interdit : `any`, `@ts-ignore`, assertions non justifiées
- Toujours une interface nommée pour les props, jamais inline
- Préférer discriminated unions pour les state machines
- Utiliser `unknown` aux boundaries et valider avant usage

## Formulaires

- React Hook Form pour tous les formulaires
- Validation Zod obligatoire
- Feedback de validation visible sur chaque champ
- Gérer les erreurs serveur dans le formulaire, pas seulement en toast

## Performance

- `React.memo` sur les custom nodes ReactFlow
- `useCallback` sur les handlers passés aux nodes
- Virtualiser les listes de plus de 50 éléments
- Lazy-load les composants lourds (ReactFlow, Export viewer)
- `next/image` pour toutes les images
- Ne jamais importer une lib entière pour un seul utilitaire

## Responsive

Vérifier chaque page sur :

- mobile (< 640px)
- tablet (640px–1024px)
- desktop (> 1024px)

Ne pas résoudre le responsive en cachant des fonctionnalités importantes.

## Qualité

- Fichier > 300 lignes → revoir la séparation des responsabilités
- Pas de code mort laissé en place
- Pas de code commenté
- Pas de console.log en production
- Pas de mocks présentés comme du code production-ready
