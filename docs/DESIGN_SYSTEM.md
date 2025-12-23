# Design System - Boom Informatique

## 1. Direction créative

### Concept : "Precision Tech"
Une esthétique qui évoque la **précision d'ingénierie** et la **fiabilité technique**. Inspirée des interfaces de monitoring haute performance, des blueprints techniques et de l'électronique de précision.

### Mots-clés visuels
- Précis, net, angulaire
- Technique mais accessible
- Professionnel avec une touche de dynamisme
- Confiance et expertise

### Ce qui nous différencie
- Micro-interactions soignées sur les éléments techniques
- Grille de fond subtile rappelant les circuits imprimés
- Accents lumineux évoquant les LED d'équipements
- Typographie technique mais lisible

---

## 2. Palette de couleurs

### Couleur principale - Electric Blue
Un bleu légèrement désaturé, évoquant les écrans haute définition.

```css
:root {
  /* Primary - Electric Blue */
  --primary-50: #f0f7ff;
  --primary-100: #e0efff;
  --primary-200: #b9dfff;
  --primary-300: #7cc4ff;
  --primary-400: #36a5ff;
  --primary-500: #0c8ce9;  /* Principal */
  --primary-600: #006fca;
  --primary-700: #0058a3;
  --primary-800: #054a86;
  --primary-900: #0a3d6e;
  --primary-950: #072649;
}
```

### Couleur d'accent - Signal Cyan
Pour les highlights et les états actifs, évoquant les indicateurs LED.

```css
:root {
  --accent-400: #22d3ee;
  --accent-500: #06b6d4;
  --accent-600: #0891b2;
}
```

### Neutres - Graphite
Gris bleutés pour une cohérence avec le bleu principal.

```css
:root {
  /* Light mode */
  --surface-50: #f8fafc;
  --surface-100: #f1f5f9;
  --surface-200: #e2e8f0;
  --surface-300: #cbd5e1;

  /* Text & borders */
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-default: #e2e8f0;
  --border-strong: #cbd5e1;

  /* Dark mode surfaces */
  --surface-800: #1e293b;
  --surface-900: #0f172a;
  --surface-950: #020617;
}
```

### Couleurs sémantiques

```css
:root {
  /* Success - Néon vert */
  --success-light: #d1fae5;
  --success: #10b981;
  --success-dark: #059669;

  /* Warning - Ambre */
  --warning-light: #fef3c7;
  --warning: #f59e0b;
  --warning-dark: #d97706;

  /* Error - Signal rouge */
  --error-light: #fee2e2;
  --error: #ef4444;
  --error-dark: #dc2626;

  /* Info */
  --info-light: #e0f2fe;
  --info: #0ea5e9;
  --info-dark: #0284c7;
}
```

### Couleurs métier

```css
:root {
  /* Stock indicators */
  --stock-available: #10b981;
  --stock-low: #f59e0b;
  --stock-out: #ef4444;

  /* Pricing */
  --price-normal: var(--text-primary);
  --price-sale: #dc2626;
  --price-crossed: var(--text-muted);

  /* B2B Pro badge */
  --pro-badge: #8b5cf6;
  --pro-badge-glow: rgba(139, 92, 246, 0.3);
}
```

---

## 3. Typographie

### Police display - Clash Display
Police géométrique avec du caractère pour les titres. Évoque la tech moderne.

```css
@import url('https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&display=swap');

--font-display: 'Clash Display', system-ui, sans-serif;
```

### Police body - Satoshi
Sans-serif moderne, excellente lisibilité, personnalité subtile.

```css
@import url('https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap');

--font-body: 'Satoshi', system-ui, sans-serif;
```

### Police mono - JetBrains Mono
Pour les specs techniques, références produits, prix.

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');

--font-mono: 'JetBrains Mono', monospace;
```

### Échelle typographique

| Token | Taille | Line-height | Font | Poids | Usage |
|-------|--------|-------------|------|-------|-------|
| `display-xl` | 56px | 1.1 | Clash | 600 | Hero principal |
| `display` | 44px | 1.15 | Clash | 600 | Titres de page |
| `h1` | 36px | 1.2 | Clash | 600 | Sections majeures |
| `h2` | 28px | 1.25 | Clash | 500 | Sous-sections |
| `h3` | 22px | 1.3 | Satoshi | 700 | Cards, modules |
| `h4` | 18px | 1.4 | Satoshi | 700 | Labels importants |
| `body-lg` | 18px | 1.6 | Satoshi | 400 | Texte vedette |
| `body` | 16px | 1.6 | Satoshi | 400 | Texte courant |
| `body-sm` | 14px | 1.5 | Satoshi | 400 | Texte secondaire |
| `caption` | 12px | 1.4 | Satoshi | 500 | Labels, méta |
| `mono` | 14px | 1.4 | JetBrains | 400 | Specs, SKU, prix |

### Exemples d'application

```
Prix:        font-mono, 24px, weight-500
SKU:         font-mono, 12px, text-muted
Specs:       font-mono, 14px
Boutons:     font-body, 15px, weight-500, tracking-wide
Navigation:  font-body, 14px, weight-500
```

---

## 4. Espacements

### Échelle (base 4px)

```css
--space-0: 0;
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
--space-32: 128px;
```

### Application

| Contexte | Token | Valeur |
|----------|-------|--------|
| Gap inline (icône + texte) | `space-2` | 8px |
| Gap éléments groupés | `space-3` | 12px |
| Padding boutons | `space-3 space-5` | 12px 20px |
| Padding cards | `space-5` | 20px |
| Gap grille produits | `space-5` | 20px |
| Entre sections | `space-12` to `space-16` | 48-64px |
| Padding page mobile | `space-4` | 16px |
| Padding page desktop | `space-8` | 32px |

---

## 5. Effets visuels

### Rayons de bordure

```css
--radius-none: 0;
--radius-sm: 4px;      /* Tags, badges */
--radius-md: 8px;      /* Boutons, inputs */
--radius-lg: 12px;     /* Cards */
--radius-xl: 16px;     /* Modals, sections */
--radius-2xl: 24px;    /* Hero cards */
--radius-full: 9999px; /* Pills, avatars */
```

### Ombres

```css
/* Mode clair */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 12px -2px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 12px 24px -4px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 24px 48px -8px rgba(0, 0, 0, 0.12);

/* Glow effects (pour accents) */
--glow-primary: 0 0 20px rgba(12, 140, 233, 0.3);
--glow-accent: 0 0 20px rgba(6, 182, 212, 0.4);
--glow-success: 0 0 16px rgba(16, 185, 129, 0.4);

/* Mode sombre - bordures lumineuses au lieu d'ombres */
--border-glow: 1px solid rgba(255, 255, 255, 0.08);
```

### Textures & Backgrounds

```css
/* Grille technique (fond de page) */
.bg-grid {
  background-image:
    linear-gradient(rgba(12, 140, 233, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(12, 140, 233, 0.03) 1px, transparent 1px);
  background-size: 32px 32px;
}

/* Noise texture overlay */
.bg-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.02;
}

/* Gradient hero */
.bg-hero-gradient {
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(12, 140, 233, 0.15), transparent),
    var(--surface-50);
}

/* Dark mode hero */
.dark .bg-hero-gradient {
  background:
    radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.1), transparent),
    var(--surface-950);
}
```

### Glassmorphism (Header, overlays)

```css
.glass {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.dark .glass {
  background: rgba(15, 23, 42, 0.8);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
```

---

## 6. Composants

### 6.1 Boutons

#### Variantes

| Variante | Background | Text | Border | Usage |
|----------|------------|------|--------|-------|
| Primary | primary-500 | white | none | Actions principales |
| Secondary | surface-100 | text-primary | border-default | Actions secondaires |
| Outline | transparent | primary-600 | primary-300 | Actions tertiaires |
| Ghost | transparent | text-secondary | none | Actions subtiles |
| Destructive | error | white | none | Actions dangereuses |

#### Styles

```css
.btn {
  font-family: var(--font-body);
  font-weight: 500;
  letter-spacing: 0.01em;
  border-radius: var(--radius-md);
  transition: all 150ms ease-out;
}

.btn-primary {
  background: var(--primary-500);
  color: white;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.btn-primary:hover {
  background: var(--primary-600);
  box-shadow: var(--glow-primary);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0) scale(0.98);
}
```

#### Tailles

| Taille | Height | Padding | Font |
|--------|--------|---------|------|
| sm | 32px | 8px 14px | 13px |
| md | 40px | 10px 18px | 14px |
| lg | 48px | 12px 24px | 15px |
| xl | 56px | 14px 32px | 16px |

### 6.2 Product Card

```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │                                  │ │
│ │         [Image 4:3]              │ │  ← Hover: scale 1.02
│ │                                  │ │
│ │  [PROMO -15%]          [♡]      │ │  ← Badge + Wishlist
│ └──────────────────────────────────┘ │
│                                      │
│  ASUS                                │  ← Mono, muted, uppercase
│  ROG Strix GeForce RTX 4080         │  ← H4, 2 lignes max
│                                      │
│  ★★★★☆  (127)                       │  ← Stars + count
│                                      │
│  ┌────────────────────────────────┐ │
│  │ 1 299,00 €                     │ │  ← Mono, bold, large
│  │ ● En stock                     │ │  ← Dot + status
│  └────────────────────────────────┘ │
│                                      │
│  [     Ajouter au panier      🛒]   │  ← Full width button
└──────────────────────────────────────┘
```

#### Spécifications

```css
.product-card {
  background: var(--surface-50);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-default);
  overflow: hidden;
  transition: all 200ms ease-out;
}

.product-card:hover {
  border-color: var(--primary-200);
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
}

.dark .product-card:hover {
  border-color: var(--primary-700);
  box-shadow: var(--glow-primary);
}

.product-card__image {
  aspect-ratio: 4/3;
  object-fit: contain;
  background: white;
  transition: transform 300ms ease-out;
}

.product-card:hover .product-card__image {
  transform: scale(1.03);
}

.product-card__price {
  font-family: var(--font-mono);
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
```

### 6.3 Header / Navigation

```
┌────────────────────────────────────────────────────────────────────────────┐
│  [LOGO]    Ordinateurs  Composants  Réseau  Périphériques    🔍  👤  🛒(3) │
└────────────────────────────────────────────────────────────────────────────┘
```

#### Spécifications

```css
.header {
  height: 64px;
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-default);
}

.nav-link {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 8px 12px;
  border-radius: var(--radius-md);
  transition: all 150ms;
}

.nav-link:hover {
  color: var(--text-primary);
  background: var(--surface-100);
}

.nav-link[data-active="true"] {
  color: var(--primary-600);
}

.cart-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 18px;
  height: 18px;
  background: var(--primary-500);
  color: white;
  font-size: 11px;
  font-weight: 600;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### 6.4 Inputs

```css
.input {
  height: 44px;
  padding: 0 14px;
  font-size: 15px;
  background: var(--surface-50);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-md);
  transition: all 150ms;
}

.input:focus {
  outline: none;
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px rgba(12, 140, 233, 0.1);
}

.input:hover:not(:focus) {
  border-color: var(--border-strong);
}

.input--error {
  border-color: var(--error);
}

.input--error:focus {
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

/* Search input avec icône */
.search-input {
  padding-left: 44px;
  background-image: url("data:image/svg+xml,..."); /* Search icon */
  background-repeat: no-repeat;
  background-position: 14px center;
}
```

### 6.5 Badges & Stock indicators

```css
/* Stock badge avec dot lumineux */
.stock-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

.stock-badge__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

.stock-badge--available .stock-badge__dot {
  background: var(--stock-available);
  box-shadow: 0 0 8px var(--stock-available);
}

.stock-badge--low .stock-badge__dot {
  background: var(--stock-low);
  animation: blink 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

/* Promo badge */
.badge-promo {
  background: var(--error);
  color: white;
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
}

/* Pro badge avec glow */
.badge-pro {
  background: var(--pro-badge);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  box-shadow: var(--pro-badge-glow);
}
```

### 6.6 Tables (Admin)

```css
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.table th {
  text-align: left;
  padding: 12px 16px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted);
  background: var(--surface-100);
  border-bottom: 1px solid var(--border-default);
}

.table td {
  padding: 16px;
  border-bottom: 1px solid var(--border-default);
  font-size: 14px;
}

.table tr:hover td {
  background: var(--surface-50);
}

/* Mono pour les données techniques */
.table td[data-type="sku"],
.table td[data-type="price"],
.table td[data-type="stock"] {
  font-family: var(--font-mono);
}
```

---

## 7. Animations & Motion

### Principes
- **Subtil mais présent** : Les animations renforcent l'interaction sans distraire
- **Performance first** : Utiliser transform et opacity uniquement
- **Respecter les préférences** : `prefers-reduced-motion`

### Timing functions

```css
--ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Durées

| Type | Durée | Usage |
|------|-------|-------|
| Instant | 100ms | Hover states simples |
| Fast | 150ms | Boutons, toggles |
| Normal | 200ms | Cards, expansions |
| Slow | 300ms | Modals, pages |
| Reveal | 400ms | Animations d'entrée |

### Animations clés

```css
/* Fade in up - Pour les éléments qui apparaissent */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 400ms var(--ease-out) forwards;
}

/* Stagger pour les listes */
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 50ms; }
.stagger-item:nth-child(3) { animation-delay: 100ms; }
.stagger-item:nth-child(4) { animation-delay: 150ms; }
/* ... */

/* Skeleton loading */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--surface-200) 0%,
    var(--surface-100) 50%,
    var(--surface-200) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}

/* Cart badge pop */
@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.cart-badge--updated {
  animation: pop 300ms var(--ease-spring);
}

/* Page transition */
.page-enter {
  opacity: 0;
  transform: translateY(8px);
}

.page-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: all 300ms var(--ease-out);
}
```

### Hover effects remarquables

```css
/* Product card lift */
.product-card {
  transition: transform 200ms var(--ease-out),
              box-shadow 200ms var(--ease-out),
              border-color 200ms var(--ease-out);
}

.product-card:hover {
  transform: translateY(-4px);
}

/* Button glow pulse on focus */
.btn-primary:focus-visible {
  animation: glow-pulse 1.5s infinite;
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(12, 140, 233, 0.4); }
  50% { box-shadow: 0 0 0 8px rgba(12, 140, 233, 0); }
}

/* Image zoom on hover */
.product-image-container {
  overflow: hidden;
}

.product-image {
  transition: transform 400ms var(--ease-out);
}

.product-image-container:hover .product-image {
  transform: scale(1.05);
}
```

---

## 8. Responsive Design

### Breakpoints

```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;
```

### Container

```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 640px) {
  .container { padding: 0 var(--space-6); }
}

@media (min-width: 1024px) {
  .container { padding: 0 var(--space-8); max-width: 1280px; }
}

@media (min-width: 1536px) {
  .container { max-width: 1440px; }
}
```

### Grille produits

| Breakpoint | Colonnes | Gap |
|------------|----------|-----|
| < 640px | 2 | 12px |
| 640-767px | 2 | 16px |
| 768-1023px | 3 | 20px |
| 1024-1279px | 4 | 20px |
| ≥ 1280px | 4-5 | 24px |

### Mobile adaptations
- Header: 56px height, hamburger menu
- Navigation: Bottom sheet avec backdrop
- Filtres: Full-screen modal
- Cards: Stack vertical en 1 colonne sur très petits écrans
- Touch targets: minimum 44×44px

---

## 9. Mode Sombre

### Variables CSS

```css
:root {
  --bg-page: var(--surface-50);
  --bg-card: white;
  --bg-elevated: white;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: var(--border-default);
}

:root.dark {
  --bg-page: var(--surface-950);
  --bg-card: var(--surface-900);
  --bg-elevated: var(--surface-800);
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border-color: rgba(255, 255, 255, 0.08);
}
```

### Spécificités dark mode
- Ombres remplacées par bordures lumineuses subtiles
- Glow effects plus prononcés
- Images produits: fond blanc conservé pour le contraste
- Primary color légèrement plus claire pour le contraste

### Toggle implementation

```typescript
// Préférence système + localStorage
const getTheme = () => {
  if (typeof localStorage !== 'undefined' && localStorage.theme) {
    return localStorage.theme
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}
```

---

## 10. Accessibilité

### Contrastes
- Texte principal: minimum 7:1 (AAA)
- Texte secondaire: minimum 4.5:1 (AA)
- Éléments UI: minimum 3:1

### Focus visible

```css
:focus-visible {
  outline: 2px solid var(--primary-500);
  outline-offset: 2px;
}

/* Focus amélioré pour les boutons */
.btn:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px var(--bg-page), 0 0 0 4px var(--primary-500);
}
```

### Skip links

```html
<a href="#main" class="skip-link">
  Aller au contenu principal
</a>
```

### Annonces ARIA
- Mise à jour panier: `aria-live="polite"`
- Erreurs formulaire: `aria-live="assertive"`
- Loading states: `aria-busy="true"`

---

## 11. Iconographie

### Librairie
**Lucide React** - Icons cohérents, stroke-based

### Tailles

| Token | Taille | Stroke | Usage |
|-------|--------|--------|-------|
| xs | 14px | 1.5px | Inline small text |
| sm | 16px | 1.5px | Badges, inline |
| md | 20px | 2px | Boutons, nav |
| lg | 24px | 2px | Cards, titres |
| xl | 32px | 2px | Empty states |
| 2xl | 48px | 1.5px | Hero illustrations |

### Icons principales

```
Navigation: Menu, X, ChevronDown, ChevronRight, ArrowLeft, ArrowRight
Commerce: ShoppingCart, Heart, CreditCard, Truck, Package, Receipt
User: User, LogIn, LogOut, Settings, Building2 (B2B)
Produits: Cpu, Monitor, HardDrive, Router, Keyboard, Mouse
Status: Check, AlertTriangle, XCircle, Info, Clock
Actions: Search, Filter, SortAsc, Download, Share, ExternalLink
Admin: BarChart3, Users, FolderOpen, FileText, Settings
```

---

## 12. Assets

### Logo
```
/public/logo.svg              (couleur, fond clair)
/public/logo-white.svg        (blanc, fond sombre)
/public/logo-icon.svg         (icône seule, 1:1)
/public/logo-icon-mono.svg    (monochrome)
```

### Favicons
```
/public/favicon.ico
/public/favicon-16x16.png
/public/favicon-32x32.png
/public/favicon.svg           (vecteur avec dark mode support)
/public/apple-touch-icon.png  (180×180)
/public/site.webmanifest
```

### Open Graph
```
/public/og-image.jpg          (1200×630)
/public/og-image-square.jpg   (1200×1200, pour certains réseaux)
```

---

*Design System v2.0 - Boom Informatique*
*Créé le 23 décembre 2025*
*Direction créative: Precision Tech*
