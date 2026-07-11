---
paths:
  - "src/**/*.{ts,tsx,css}"
  - "app/**/*.{ts,tsx,css}"
  - "styles/**/*.css"
---

# Design System — Manbaa (عبنم)

# Source : design.md (Apple Design Analysis) — seule source de vérité visuelle

## Couleurs — tokens CSS obligatoires

### Brand & Accent

```css
--color-primary: #0066cc; /* Action Blue — TOUS les éléments interactifs */
--color-primary-focus: #0071e3; /* Focus ring clavier uniquement */
--color-primary-on-dark: #2997ff; /* Liens sur surfaces sombres UNIQUEMENT */
```

### Surfaces

```css
--color-canvas: #ffffff;
--color-canvas-parchment: #f5f5f7;
--color-surface-pearl: #fafafc;
--color-surface-tile-1: #272729;
--color-surface-tile-2: #2a2a2c;
--color-surface-tile-3: #252527;
--color-surface-black: #000000;
--color-surface-chip-translucent: rgba(210, 210, 215, 0.64);
```

### Texte

```css
--color-ink: #1d1d1f;
--color-body-on-dark: #ffffff;
--color-body-muted: #cccccc;
--color-ink-muted-80: #333333;
--color-ink-muted-48: #7a7a7a;
```

### Hairlines

```css
--color-divider-soft: #f0f0f0;
--color-hairline: #e0e0e0;
```

## Typographie

### Font stack

```css
--font-display: "SF Pro Display", system-ui, -apple-system, sans-serif;
--font-body: "SF Pro Text", system-ui, -apple-system, sans-serif;
/* Fallback non-Apple : Inter avec font-feature-settings: "ss03" */
```

### Hiérarchie

```
hero-display    56px
display-lg      40px
display-md      34px
lead            28px
lead-airy       24px
tagline         21px
body-strong     17px
body            17px
dense-link      17px
caption         14px
caption-strong  14px
button-large    18px
button-utility  14px
fine-print      12px
micro-legal     10px
nav-link        12px
```

### Règles typographiques

- Body copy : **17px obligatoire** — jamais 16px
- Letter-spacing négatif pour les titres ≥ 17px
- Échelle de poids : **300 / 400 / 600 / 700** — le 500 est délibérément absent
- Line-height body : minimum 1.47

## Espacement

```css
--spacing-xxs: 4px;
--spacing-xs: 8px;
--spacing-sm: 12px;
--spacing-md: 17px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-xxl: 48px;
--spacing-section: 80px;
```

## Border Radius

```css
--radius-none: 0px; /* Tiles full-bleed */
--radius-xs: 5px; /* Inline chips */
--radius-sm: 8px; /* Boutons dark utility, imagery */
--radius-md: 11px; /* Pearl Button capsules */
--radius-lg: 18px; /* Cards utility */
--radius-pill: 9999px; /* CTAs primaires, search input, chips */
--radius-full: 50%; /* Contrôles circulaires */
```

## Élévation & Ombres

**UNE SEULE drop-shadow dans tout le système** — appliquée aux images produit uniquement.

```
Flat          → pas de shadow, pas de border
Soft hairline → 1px rgba(0,0,0,0.08) border
Backdrop blur → backdrop-filter: blur(N) sur Parchment 80%
Product shadow → rgba(0,0,0,0.22) 3px 5px 30px 0  ← IMAGES PRODUIT SEULEMENT
```

## Boutons — variantes et grammaire

| Variante       | Background             |
| -------------- | ---------------------- |
| primary        | #0066cc                |
| secondary-pill | transparent            |
| dark-utility   | #1d1d1f                |
| pearl-capsule  | #fafafc                |
| store-hero     | #0066cc                |
| icon-circular  | rgba(210,210,215,0.64) |

**Active state obligatoire sur TOUS les boutons :**

```css
button:active {
  transform: scale(0.95);
}
```

## DO — règles à respecter

- `#0066cc` pour CHAQUE élément interactif — rien d'autre
- Titres avec letter-spacing négatif
- Body copy à 17px / 400 / line-height 1.47
- Alterner tiles claires/sombres — le changement de couleur EST le séparateur de section
- Radius pill réservé aux CTAs primaires
- Product-shadow uniquement sur les rendus produit
- `transform: scale(0.95)` comme active/press state sur chaque bouton

## DON'T — règles à ne jamais violer

- Pas de deuxième couleur accent
- Pas de shadows sur cards, boutons ou texte
- Pas de gradients comme backgrounds décoratifs
- Pas de body copy en weight 500
- Pas de radius sur les tiles full-bleed
- Pas de line-height < 1.47 pour le body copy
- Pas de mix de radius grammars
- Pas de `#2997ff` sur surfaces claires
- Supprimer : `.bg-mesh`, `.bg-gradient-primary`, `.bg-gradient-surface`, `.text-gradient-primary`
- Supprimer : `.glass`, `--shadow-glow`, `--shadow-elevated`
- Supprimer toute référence indigo-violet

## Alternance light/dark

Les sections de page alternent entre surfaces claires et sombres.
Le changement de couleur de surface EST le diviseur de section.
Ne pas ajouter de borders ou shadows supplémentaires pour diviser les sections.
