---
name: validate-design-tokens
description: Auditer un composant ou une page pour vérifier la conformité au design system Manbaa.
---

# Validate Design Tokens

## Vérifications à effectuer

### Couleurs

- Grep pour les références hexadécimales hardcodées
- Grep pour les classes Tailwind indigo/violet/purple
- Vérifier que tous les éléments interactifs utilisent `--color-primary` (#0066cc)
- Vérifier que `--color-primary-on-dark` (#2997ff) n'est pas utilisé sur fond clair

### Typographie

- Vérifier que le body copy est à 17px (text-[17px] ou token équivalent)
- Vérifier l'absence de font-weight 500
- Vérifier le letter-spacing négatif sur les titres

### Spacing

- Vérifier l'utilisation des tokens --spacing-\* ou équivalents Tailwind
- Pas de valeurs px hardcodées pour l'espacement

### Boutons

- Vérifier `active:scale-95` sur tous les boutons
- Vérifier les variantes : primary / secondary-pill / dark-utility / pearl-capsule / icon-circular

### Éléments interdits

- Grep pour `.bg-gradient`, `.bg-mesh`, `.glass`
- Grep pour `box-shadow` sur cards ou boutons (hors product imagery)
- Grep pour `filter: drop-shadow` hors images produit

## Rapport

Lister chaque violation avec :

- fichier et ligne
- token attendu
- valeur trouvée
- correction recommandée
