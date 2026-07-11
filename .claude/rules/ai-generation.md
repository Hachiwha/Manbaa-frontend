---
paths:
  - "src/features/ai-results/**"
  - "src/features/chat/**"
  - "src/features/brand-document/**"
  - "src/lib/api/tasks*"
  - "src/hooks/useAiTask*"
---

# AI Generation Rules — Manbaa

## Architecture générale

Le frontend ne parle jamais directement aux workers FastAPI.
Tout passe par NestJS via REST (création de tâche) et Socket.IO (progression et résultat).

```
User action
  → POST /api/v1/workspaces/:id/ai-tasks   (NestJS)
  → NestJS publie sur NATS
  → AI worker traite
  → Socket.IO events → Live AI Results panel
```

## Cycle de vie d'une tâche IA côté frontend

```
1. User déclenche une action
2. POST pour créer la tâche → status: QUEUED
3. Rejoindre la room Socket.IO du workspace
4. Écouter les events de progression
5. Afficher le streaming token par token dans Live Results
6. À completion → afficher le résultat final avec citations
7. Proposer : Add to board / Save as note / Copy / Export
```

## Events Socket.IO à écouter

```typescript
"ai:task:started"   → { taskId, taskType }
"ai:task:progress"  → { taskId, progress, currentStep, partialOutput }
"ai:task:completed" → { taskId, result, citations }
"ai:task:failed"    → { taskId, errorCode, errorMessage }
"source:indexed"    → { sourceId }
"source:failed"     → { sourceId, error }
"asset:generated"   → { assetId, assetUrl }
```

## Task types supportés

```
chat
brief.generate
brief.update
research.market
research.competitors
strategy.generate
direction.generate
prompt.enhance
canvas.analyze
concept.evaluate
brand-system.plan
```

## Statuts de tâche à afficher

```
QUEUED              → "En attente..."
RUNNING             → streaming actif
WAITING_FOR_USER    → input utilisateur requis
COMPLETED           → résultat final
FAILED              → erreur avec message
CANCELLED           → annulé par l'utilisateur
```

## Live AI Results Panel — règles

- Panel permanent sur desktop (colonne droite)
- Onglets : Live / Result / Sources / History
- Afficher le texte en streaming token par token
- Citations affichées avec : titre source, type, localisation, extrait
- Actions disponibles : Add to board / Add section / Add citation / Save as note / Copy / Retry / Regenerate
- Socket.IO en priorité — polling 5s max en fallback
- Ne jamais fabriquer des citations ou des outputs

## Chat — règles

- Bouton flottant rond en bas à droite
- Ouvre un drawer/sheet, pas une colonne permanente
- Fermeture avec Escape
- Préserver le draft à la fermeture
- Persister l'historique de conversation
- Fonctions : poser des questions, sélectionner des sources, attacher des nodes du board, envoyer des instructions, stopper la génération
- Modes : workspace-grounded (défaut) / selected-sources-only / general-assistant

## Règles de sécurité IA

- Traiter les outputs IA comme des inputs non fiables
- Valider avec Zod avant d'utiliser dans le state
- Ne jamais appliquer directement sur le board sans confirmation utilisateur pour les changements destructifs
- Préserver les task IDs pour l'auditabilité
