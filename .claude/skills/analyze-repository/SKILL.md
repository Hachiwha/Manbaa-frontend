---
name: analyze-repository
description: Analyser le dépôt, son architecture et ses risques sans implémenter de code.
---

# Analyze Repository

## Étapes

1. Lire CLAUDE.md et toutes les règles .claude/rules/
2. Inventorier les packages, applications et technologies
3. Identifier les entry points et les boundaries de modules
4. Inspecter les tests, scripts de build et CI
5. Comparer la documentation avec l'implémentation réelle
6. Identifier les doublons, code mort, patterns incohérents
7. Séparer les faits vérifiés des hypothèses
8. Lister les risques, gaps et actions recommandées

## Ne pas faire

- Ne pas implémenter de code sauf si explicitement demandé après l'analyse
- Ne pas modifier de fichiers existants
- Ne pas inventer des endpoints ou types sans les marquer comme propositions

## Livrable

Rapport structuré :
- Inventaire technique
- Patterns existants
- Gaps par rapport à la spec
- Contradictions identifiées
- Top 10 risques
- Décisions non résolues
- Première tâche d'implémentation recommandée
