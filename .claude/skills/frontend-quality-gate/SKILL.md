---
name: frontend-quality-gate
description: Vérification complète avant de considérer une feature terminée. Retourne PASS ou FAIL avec violations exactes.
---

# Frontend Quality Gate

## Exécuter dans cet ordre

```bash
bun run lint
bun run typecheck
bun run test
bun run build
```

## Vérifications design system

- [ ] Aucune référence indigo-violet restante
- [ ] Aucun gradient décoratif
- [ ] Aucune shadow sur cards, boutons ou texte
- [ ] Body copy à 17px partout
- [ ] Poids 500 absent (uniquement 300/400/600/700)
- [ ] `transform: scale(0.95)` sur tous les boutons au state active
- [ ] `#0066cc` comme seule couleur interactive
- [ ] `#2997ff` uniquement sur surfaces sombres
- [ ] Tokens CSS utilisés — pas de valeurs hardcodées

## Vérifications TypeScript

- [ ] Strict mode — zéro erreur
- [ ] Aucun `any`
- [ ] Aucun `@ts-ignore`
- [ ] Interfaces nommées pour toutes les props

## Vérifications UX

- [ ] État loading présent
- [ ] État empty présent
- [ ] État error présent
- [ ] Touch targets ≥ 44×44px
- [ ] Navigation clavier fonctionnelle
- [ ] Focus visible sur tous les éléments interactifs
- [ ] HTML sémantique (pas de div cliquable)
- [ ] Responsive : mobile / tablet / desktop

## Vérifications sécurité

- [ ] Pas de token en localStorage
- [ ] Pas de secrets exposés
- [ ] Organization/workspace scope présent dans les requêtes

## Résultat

Retourner PASS uniquement si tous les checks requis ont été exécutés avec succès.
Sinon retourner FAIL avec la liste exacte des violations.
