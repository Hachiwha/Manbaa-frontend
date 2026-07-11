---
name: implement-feature
description: Implémenter une feature frontend de manière contrôlée — plan, tranche verticale, tests, validation.
---

# Implement Feature

## Workflow obligatoire

1. Lire CLAUDE.md et les règles .claude/rules/ concernées
2. Inspecter l'implémentation existante dans le périmètre
3. Identifier les patterns déjà en place
4. Créer un plan concis (fichiers à créer/modifier, risques, dépendances)
5. Implémenter la plus petite tranche verticale cohérente
6. Ajouter ou mettre à jour les tests
7. Exécuter : `bun run lint && bun run typecheck && bun run test && bun run build`
8. Inspecter le diff final pour détecter les changements non liés
9. Mettre à jour la documentation si nécessaire
10. Rapporter les résultats et risques restants

## Checklist avant de commencer

- [ ] Les endpoints backend requis existent-ils ?
- [ ] Les DTOs sont-ils connus ?
- [ ] Y a-t-il des contradictions avec les contrats ?
- [ ] Quels composants existants peuvent être réutilisés ?
- [ ] Quels stores Zustand sont concernés ?
- [ ] Quelles queries TanStack Query sont concernées ?

## Checklist avant de terminer

- [ ] TypeScript compile sans erreur
- [ ] Aucun `any` introduit
- [ ] États loading / empty / error présents
- [ ] Responsive testé (mobile / tablet / desktop)
- [ ] Socket.IO listeners nettoyés dans les useEffect cleanup
- [ ] Lint sans warning
- [ ] Build sans erreur
- [ ] Pas de console.log laissé
- [ ] Pas de mock présenté comme production-ready
