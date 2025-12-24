# PRD - Boom Informatique

## 1. Vue d'ensemble

### 1.1 Description du projet
**Boom Informatique** est une boutique en ligne de vente de matériel informatique et réseau, destinée aux particuliers (B2C) et aux professionnels (B2B). La plateforme offre un catalogue complet avec gestion de stock en temps réel, un système de commandes avec retrait en boutique ou livraison locale, et un espace d'administration complet.

### 1.2 Objectifs
- Proposer un catalogue clair et organisé de matériel informatique
- Permettre aux clients de passer commande en ligne avec paiement différé (espèces/chèque)
- Différencier l'expérience B2B (tarifs HT, devis, conditions de paiement)
- Gérer efficacement le stock et les commandes via un back-office complet
- Offrir une expérience utilisateur moderne et performante

### 1.3 Stack technique
| Technologie | Usage |
|-------------|-------|
| TanStack Start | Framework fullstack React |
| TanStack Router | Routing type-safe |
| TanStack Query | Gestion des données serveur |
| TanStack Form | Formulaires avec validation |
| TanStack Table | Tableaux de données (admin) |
| Drizzle ORM | ORM TypeScript pour SQLite/D1 |
| Tailwind CSS v4 | Styling |
| Zod | Validation des schémas |
| **Cloudflare Workers** | Hébergement serverless edge |
| **Cloudflare D1** | Base de données SQLite distribuée |
| **Cloudflare R2** | Stockage d'objets (images produits) |

---

## 2. Utilisateurs cibles

### 2.1 Personas

#### Client Particulier (B2C)
- Recherche du matériel informatique pour usage personnel
- Sensible aux prix TTC
- Souhaite comparer les produits et consulter les avis
- Préfère le retrait en boutique ou livraison locale

#### Client Professionnel (B2B)
- Achète pour son entreprise (TPE/PME, administration)
- Nécessite des devis et factures pro forma
- Bénéficie de tarifs HT et remises volume
- Peut avoir des conditions de paiement différées

#### Administrateur
- Gère le catalogue produits
- Traite les commandes et devis
- Suit le stock en temps réel
- Analyse les statistiques de vente

---

## 3. Fonctionnalités

### 3.1 Module Catalogue

#### 3.1.1 Catégories de produits
```
├── Ordinateurs complets
│   ├── PC de bureau
│   ├── Ordinateurs portables
│   ├── Stations de travail
│   ├── Serveurs
│   └── Mini PC
├── Composants PC
│   ├── Processeurs (CPU)
│   ├── Cartes mères
│   ├── Mémoire RAM
│   ├── Cartes graphiques (GPU)
│   ├── Stockage (SSD, HDD)
│   ├── Alimentations
│   ├── Boîtiers
│   ├── Refroidissement
│   └── Cartes d'extension
├── Réseau
│   ├── Routeurs
│   ├── Switches
│   ├── Points d'accès WiFi
│   ├── Câbles réseau
│   ├── Baies et accessoires
│   ├── NAS
│   └── Pare-feu
└── Périphériques
    ├── Écrans / Moniteurs
    ├── Claviers
    ├── Souris
    ├── Imprimantes
    ├── Scanners
    ├── Webcams
    ├── Casques / Audio
    └── Onduleurs (UPS)
```

#### 3.1.2 Fiche produit
- Nom et description détaillée
- Images multiples (galerie)
- Prix TTC (B2C) / Prix HT (B2B)
- Référence fabricant et code EAN
- Spécifications techniques (attributs dynamiques)
- État du stock (quantité, seuil d'alerte)
- Produits associés / compatibles
- Marque et catégorie

#### 3.1.3 Recherche et filtres
- Recherche full-text avec suggestions
- Filtres par catégorie, marque, prix, disponibilité
- Tri par prix, popularité, nouveauté
- Comparaison de produits (jusqu'à 4)

---

### 3.2 Module Utilisateurs

#### 3.2.1 Compte client particulier (B2C)
- Inscription / Connexion (email + mot de passe)
- Profil avec coordonnées et adresses
- Historique des commandes
- Liste de favoris / Wishlist
- Préférences de notification

#### 3.2.2 Compte professionnel (B2B)
Inclut toutes les fonctionnalités B2C, plus :
- Numéro SIRET / TVA intracommunautaire
- Affichage des prix HT par défaut
- Grille tarifaire personnalisée (remises)
- Demande de devis
- Conditions de paiement (délai 30/60 jours)
- Multi-utilisateurs par entreprise (option)
- Export factures PDF

#### 3.2.3 Validation compte B2B
- Demande de compte pro via formulaire
- Validation manuelle par l'administrateur
- Vérification SIRET

---

### 3.3 Module Commandes

#### 3.3.1 Panier
- Ajout/suppression de produits
- Modification des quantités
- Calcul automatique TTC/HT selon type de compte
- Persistance du panier (localStorage + DB si connecté)
- Vérification disponibilité stock en temps réel

#### 3.3.2 Processus de commande
```
1. Panier → 2. Identification → 3. Livraison → 4. Récapitulatif → 5. Confirmation
```

#### 3.3.3 Options de livraison
| Option | Description | Délai |
|--------|-------------|-------|
| Retrait en boutique | Gratuit | Selon disponibilité |
| Livraison locale | Zone définie, tarif fixe | 24-48h |

#### 3.3.4 Modes de paiement
| Mode | Type client | Description |
|------|-------------|-------------|
| Espèces | B2C/B2B | À la livraison ou au retrait |
| Chèque | B2C/B2B | À la commande ou différé |
| Virement | B2B | Pour devis validés |
| Paiement différé | B2B | 30/60 jours selon contrat |

#### 3.3.5 Statuts de commande
```
PENDING       → Commande créée, en attente de traitement
CONFIRMED     → Commande confirmée par l'admin
PREPARING     → En cours de préparation
READY         → Prête pour retrait/livraison
SHIPPED       → En cours de livraison
DELIVERED     → Livrée/Retirée
PAID          → Payée
CANCELLED     → Annulée
```

---

### 3.4 Module Devis (B2B)

#### 3.4.1 Création de devis
- Depuis le panier ou sélection de produits
- Ajout de commentaires/besoins spécifiques
- Demande de remise volume

#### 3.4.2 Gestion des devis
- Génération PDF avec numéro unique
- Validité configurable (15/30 jours)
- Statuts : DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
- Conversion devis → commande

---

### 3.5 Module Stock

#### 3.5.1 Gestion des stocks
- Quantité disponible par produit
- Seuil d'alerte de réapprovisionnement
- Historique des mouvements de stock
- Réservation automatique à la commande

#### 3.5.2 Affichage client
| Stock | Affichage |
|-------|-----------|
| > seuil | "En stock" (vert) |
| 1 à seuil | "Stock limité" (orange) |
| 0 | "Sur commande" ou "Rupture" |

---

### 3.6 Module Administration

#### 3.6.1 Dashboard
- Commandes du jour / en attente
- Chiffre d'affaires (jour/semaine/mois)
- Alertes stock
- Nouveaux clients

#### 3.6.2 Gestion des produits
- CRUD complet (création, lecture, modification, suppression)
- Import/Export CSV
- Gestion des images (upload, tri)
- Gestion des attributs/spécifications
- Gestion des catégories et marques

#### 3.6.3 Gestion des commandes
- Liste avec filtres et recherche
- Détail commande avec historique
- Changement de statut
- Impression bon de préparation
- Génération facture PDF

#### 3.6.4 Gestion des clients
- Liste clients B2C et B2B
- Validation comptes professionnels
- Historique achats par client
- Gestion des remises B2B

#### 3.6.5 Statistiques
- CA par période
- Top produits vendus
- Répartition B2C/B2B
- Évolution du stock

---

## 4. Architecture technique

### 4.0 Infrastructure Cloudflare

#### Base de données - Cloudflare D1
- **Type** : SQLite distribué en edge
- **Avantages** : Latence faible, intégration native, coût minimal
- **Limites** : 10GB max, pas de full-text search avancé
- **Usage** : Toutes les données applicatives (users, products, orders...)

```
D1 Database: boom-informatique-db
├── Production: boom-informatique-db-prod
└── Preview: boom-informatique-db-preview
```

#### Stockage - Cloudflare R2
- **Type** : Object storage S3-compatible
- **Avantages** : Pas de frais egress, CDN intégré
- **Usage** : Images produits, logos marques, documents PDF (devis, factures)

```
R2 Buckets:
├── boom-informatique-assets (images produits, logos)
└── boom-informatique-docs (PDF devis/factures)
```

#### URLs des assets
```
Images produits : https://assets.boom-informatique.com/products/{id}/{filename}
Logos marques   : https://assets.boom-informatique.com/brands/{slug}.png
Documents       : https://docs.boom-informatique.com/{type}/{id}.pdf
```

### 4.1 Structure des routes
```
/                           → Page d'accueil
/produits                   → Catalogue
/produits/[category]        → Catégorie
/produit/[slug]             → Fiche produit
/recherche                  → Résultats de recherche
/panier                     → Panier
/commande                   → Tunnel de commande
/compte                     → Espace client
  /compte/profil            → Profil
  /compte/commandes         → Historique commandes
  /compte/favoris           → Liste de favoris
  /compte/devis             → Devis (B2B)
/auth/login                 → Connexion
/auth/register              → Inscription
/auth/register-pro          → Inscription B2B
/admin                      → Dashboard admin
  /admin/produits           → Gestion produits
  /admin/commandes          → Gestion commandes
  /admin/clients            → Gestion clients
  /admin/devis              → Gestion devis
  /admin/stock              → Gestion stock
  /admin/stats              → Statistiques
```

### 4.2 Modèle de données (Drizzle)

#### Entités principales
```typescript
// Utilisateurs
users
  - id, email, password_hash, role (CUSTOMER | PRO | ADMIN)
  - first_name, last_name, phone
  - company_name, siret, vat_number (B2B)
  - is_validated (B2B), discount_rate
  - created_at, updated_at

// Adresses
addresses
  - id, user_id, type (BILLING | SHIPPING)
  - street, city, postal_code, country
  - is_default

// Catégories
categories
  - id, name, slug, parent_id, image_url, position

// Marques
brands
  - id, name, slug, logo_url

// Produits
products
  - id, name, slug, description, sku, ean
  - brand_id, category_id
  - price_ht, tax_rate, price_ttc
  - stock_quantity, stock_alert_threshold
  - is_active, featured
  - created_at, updated_at

// Images produits
product_images
  - id, product_id, url, position, is_main

// Attributs produits
product_attributes
  - id, product_id, name, value

// Favoris
favorites
  - user_id, product_id, created_at

// Paniers
carts
  - id, user_id (nullable), session_id
  - created_at, updated_at

cart_items
  - id, cart_id, product_id, quantity

// Commandes
orders
  - id, user_id, order_number
  - status, payment_method, payment_status
  - shipping_method, shipping_address_id, billing_address_id
  - subtotal_ht, tax_amount, shipping_cost, total_ttc
  - notes, created_at, updated_at

order_items
  - id, order_id, product_id
  - product_name, product_sku (snapshot)
  - quantity, unit_price_ht, tax_rate

order_history
  - id, order_id, status, comment, created_at

// Devis (B2B)
quotes
  - id, user_id, quote_number
  - status, valid_until
  - subtotal_ht, discount_amount, tax_amount, total_ht
  - notes, created_at

quote_items
  - id, quote_id, product_id
  - quantity, unit_price_ht, discount_rate

// Mouvements de stock
stock_movements
  - id, product_id, quantity, type (IN | OUT | ADJUSTMENT)
  - reference, notes, created_at
```

### 4.3 API (Server Functions)

```typescript
// Produits
getProducts(filters, pagination)
getProduct(slug)
searchProducts(query)
getProductsByCategory(categorySlug)

// Panier
getCart()
addToCart(productId, quantity)
updateCartItem(itemId, quantity)
removeFromCart(itemId)
clearCart()

// Commandes
createOrder(orderData)
getOrders(userId)
getOrder(orderId)
cancelOrder(orderId)

// Utilisateurs
register(userData)
login(credentials)
getProfile()
updateProfile(data)

// Devis (B2B)
createQuote(quoteData)
getQuotes(userId)
acceptQuote(quoteId)

// Admin
// ... CRUD pour toutes les entités
```

---

## 5. Exigences non fonctionnelles

### 5.1 Performance
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Score Lighthouse > 90

### 5.2 Sécurité
- Authentification sécurisée (hash bcrypt)
- Protection CSRF
- Validation côté serveur (Zod)
- Sanitization des entrées
- Rate limiting sur les API sensibles

### 5.3 SEO
- SSR pour les pages publiques
- Meta tags dynamiques
- Sitemap XML
- URLs optimisées (slugs)
- Schema.org pour les produits

### 5.4 Responsive
- Mobile-first design
- Breakpoints : sm (640px), md (768px), lg (1024px), xl (1280px)

### 5.5 Accessibilité
- Conformité WCAG 2.1 AA
- Navigation clavier
- Labels ARIA

---

## 6. Roadmap

### Phase 1 - MVP (V1.0)
- [x] Setup projet TanStack Start
- [x] Modèle de données Drizzle (16 tables)
- [x] Authentification (inscription, connexion, sessions HTTP-only)
- [x] Catalogue produits (liste, fiche, recherche, filtres)
- [x] Panier (localStorage + sync serveur)
- [x] Processus de commande (checkout complet)
- [x] Espace client basique (dashboard, commandes, adresses)

### Phase 2 - B2B & Admin (V1.1)
- [x] Comptes professionnels (validation admin, session B2B)
- [x] Tarification B2B (HT, remises, hook useProPricing)
- [~] Module devis (liste, détail, envoi - édition items à compléter)
- [x] Back-office admin (dashboard, clients, produits, commandes, stock)
- [x] Gestion stock temps réel (alertes, mouvements, ajustements)

### Phase 3 - Enrichissement (V1.2)
- [ ] Comparateur de produits
- [ ] Système d'avis clients
- [ ] Notifications email
- [ ] Export PDF (devis, factures)
- [ ] Statistiques avancées

### Phase 4 - Évolutions futures
- [ ] Paiement en ligne (Stripe)
- [ ] Configurateur PC
- [ ] Programme fidélité
- [ ] API publique

---

## 7. Critères d'acceptation V1.0

### Catalogue
- [x] Affichage de minimum 3 catégories avec produits
- [x] Recherche fonctionnelle avec résultats pertinents
- [x] Filtres par catégorie, marque, prix
- [x] Fiche produit complète avec images

### Utilisateurs
- [x] Inscription/Connexion fonctionnelle
- [x] Profil éditable avec adresses
- [x] Historique des commandes accessible

### Commandes
- [x] Ajout/modification panier fluide
- [x] Tunnel de commande en 4 étapes
- [x] Choix retrait/livraison
- [ ] Confirmation par email

### Admin
- [x] Dashboard avec statistiques
- [x] Visualisation clients (liste, détail, filtres)
- [x] Validation comptes professionnels
- [~] Gestion devis (liste, détail, envoi - édition items manquante)
- [x] CRUD produits (liste, création, édition, images R2)
- [x] Gestion des commandes (liste, détail, statuts, historique)
- [x] Gestion stock (alertes, mouvements, ajustements)

---

## 8. Annexes

### 8.1 Inspirations UI
- LDLC.com (catalogue, filtres)
- Materiel.net (fiches produits)
- Amazon (tunnel de commande)

### 8.2 Glossaire
| Terme | Définition |
|-------|------------|
| B2C | Business to Consumer - Vente aux particuliers |
| B2B | Business to Business - Vente aux professionnels |
| HT | Hors Taxes |
| TTC | Toutes Taxes Comprises |
| SKU | Stock Keeping Unit - Référence interne |
| EAN | European Article Number - Code-barres |
| SIRET | Numéro d'identification des entreprises françaises |

---

*Document créé le 23 décembre 2025*
*Dernière mise à jour : 24 décembre 2025*
*Version : 1.1.0-wip - Phase 2 B2B & Admin (devis à compléter)*
