---
paths:
  - "src/features/sketch-board/**"
  - "src/components/workspace/**"
  - "src/hooks/useBoard*"
---

# Visual Builder — Sketch Board Rules

## ReactFlow — règle absolue

ReactFlow est le moteur compositionnel principal. Ne jamais le supprimer, le remplacer ou le contourner.

## Types de nodes autorisés

```typescript
type NodeType =
  | "stickyNote"
  | "textNode"
  | "headingNode"
  | "shapeNode"
  | "frameNode"
  | "imageNode"
  | "sourceCard"
  | "citationCard"
  | "chatResponseCard"
  | "conceptCard"
  | "assetCard"
  | "brandDocumentNode"
  | "groupNode";
```

Pas d'assumptions BPMN dans le board. Les types liés aux workflows sont supprimés.

## Règles de nodes

- Toujours des custom nodes — jamais le node default ReactFlow pour du vrai contenu
- Toujours typer les data de chaque node avec une interface spécifique
- IDs stables — jamais générés à partir d'index ou timestamps seuls
- `React.memo` obligatoire sur chaque custom node
- `useCallback` obligatoire sur les handlers passés aux nodes

## Persistance

- State du board persisté via API backend — jamais uniquement en mémoire
- Utiliser `useNodesState` et `useEdgesState` de ReactFlow
- Sauvegarder après chaque changement significatif (debounce 500ms)
- Snapshots versionnés côté serveur (Dev 3 / NestJS)

## Interactions supportées

Pan, zoom, sélection, multi-select, move, resize, connect, delete, duplicate, copy/paste, undo/redo, group/ungroup, context menu, drag source vers board, drag AI result vers board.

## Actions "Add to board" depuis les panels

- "Add result to board" → depuis Live AI Results
- "Add section to board" → depuis Live AI Results
- "Add citation to board" → depuis Live AI Results
- "Ask AI about this" → depuis context menu d'un node

## Layout obligatoire

```tsx
<div style={{ width: "100%", height: "100%" }}>
  <ReactFlow ... />
</div>
```

## State ownership

```
board.store.ts (Zustand) :
  - nodes et edges (ReactFlow state)
  - selectedNodes
  - historique undo/redo
  - mode actif (select / pan / connect)

Ne pas mettre dans le board store :
  - données serveur (TanStack Query)
  - état du chat
  - état des sources
```
