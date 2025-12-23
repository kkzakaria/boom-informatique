/**
 * Database seed script for Boom Informatique
 *
 * Run with: pnpm tsx scripts/seed.ts
 *
 * Note: This requires CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID,
 * and CLOUDFLARE_API_TOKEN environment variables to be set.
 */

import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../src/db/schema'

// Placeholder password hash (password: "password123")
// In production, use proper hashing
const PLACEHOLDER_PASSWORD_HASH =
  '0000000000000000000000000000000000000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'

const categories = [
  {
    name: 'Ordinateurs',
    slug: 'ordinateurs',
    imageUrl: '/images/categories/computers.jpg',
    position: 1,
  },
  {
    name: 'Composants',
    slug: 'composants',
    imageUrl: '/images/categories/components.jpg',
    position: 2,
  },
  {
    name: 'Périphériques',
    slug: 'peripheriques',
    imageUrl: '/images/categories/peripherals.jpg',
    position: 3,
  },
  {
    name: 'Réseau',
    slug: 'reseau',
    imageUrl: '/images/categories/network.jpg',
    position: 4,
  },
  {
    name: 'Stockage',
    slug: 'stockage',
    imageUrl: '/images/categories/storage.jpg',
    position: 5,
  },
  {
    name: 'Logiciels',
    slug: 'logiciels',
    imageUrl: '/images/categories/software.jpg',
    position: 6,
  },
]

const brands = [
  { name: 'HP', slug: 'hp', logoUrl: '/images/brands/hp.png' },
  { name: 'Dell', slug: 'dell', logoUrl: '/images/brands/dell.png' },
  { name: 'Lenovo', slug: 'lenovo', logoUrl: '/images/brands/lenovo.png' },
  { name: 'ASUS', slug: 'asus', logoUrl: '/images/brands/asus.png' },
  { name: 'Acer', slug: 'acer', logoUrl: '/images/brands/acer.png' },
  { name: 'MSI', slug: 'msi', logoUrl: '/images/brands/msi.png' },
  { name: 'Samsung', slug: 'samsung', logoUrl: '/images/brands/samsung.png' },
  { name: 'Western Digital', slug: 'western-digital', logoUrl: '/images/brands/wd.png' },
  { name: 'Seagate', slug: 'seagate', logoUrl: '/images/brands/seagate.png' },
  { name: 'TP-Link', slug: 'tp-link', logoUrl: '/images/brands/tplink.png' },
]

const products = [
  // Ordinateurs
  {
    name: 'HP ProBook 450 G9',
    slug: 'hp-probook-450-g9',
    description:
      'Ordinateur portable professionnel 15.6" avec processeur Intel Core i5, 8 Go RAM, SSD 256 Go.',
    sku: 'HP-PB450G9-I5',
    ean: '1234567890123',
    brandSlug: 'hp',
    categorySlug: 'ordinateurs',
    priceHt: 749.0,
    taxRate: 20,
    stockQuantity: 15,
    featured: true,
    attributes: [
      { name: 'Processeur', value: 'Intel Core i5-1235U' },
      { name: 'RAM', value: '8 Go DDR4' },
      { name: 'Stockage', value: 'SSD 256 Go NVMe' },
      { name: 'Écran', value: '15.6" FHD IPS' },
      { name: 'OS', value: 'Windows 11 Pro' },
    ],
  },
  {
    name: 'Dell OptiPlex 3000',
    slug: 'dell-optiplex-3000',
    description:
      "PC de bureau compact idéal pour l'entreprise. Intel Core i3, 8 Go RAM, SSD 256 Go.",
    sku: 'DELL-OPT3000-I3',
    ean: '1234567890124',
    brandSlug: 'dell',
    categorySlug: 'ordinateurs',
    priceHt: 549.0,
    taxRate: 20,
    stockQuantity: 20,
    featured: false,
    attributes: [
      { name: 'Processeur', value: 'Intel Core i3-12100' },
      { name: 'RAM', value: '8 Go DDR4' },
      { name: 'Stockage', value: 'SSD 256 Go' },
      { name: 'Format', value: 'Small Form Factor' },
    ],
  },
  {
    name: 'Lenovo ThinkPad E15',
    slug: 'lenovo-thinkpad-e15',
    description:
      'Laptop professionnel robuste avec clavier légendaire ThinkPad. i5, 16 Go RAM, SSD 512 Go.',
    sku: 'LEN-TP-E15-I5',
    ean: '1234567890125',
    brandSlug: 'lenovo',
    categorySlug: 'ordinateurs',
    priceHt: 899.0,
    taxRate: 20,
    stockQuantity: 8,
    featured: true,
    attributes: [
      { name: 'Processeur', value: 'Intel Core i5-1335U' },
      { name: 'RAM', value: '16 Go DDR5' },
      { name: 'Stockage', value: 'SSD 512 Go NVMe' },
      { name: 'Écran', value: '15.6" FHD IPS' },
    ],
  },

  // Composants
  {
    name: 'MSI GeForce RTX 4060',
    slug: 'msi-geforce-rtx-4060',
    description:
      'Carte graphique gaming avec architecture Ada Lovelace et DLSS 3. 8 Go GDDR6.',
    sku: 'MSI-RTX4060-8G',
    ean: '1234567890126',
    brandSlug: 'msi',
    categorySlug: 'composants',
    priceHt: 299.0,
    taxRate: 20,
    stockQuantity: 12,
    featured: true,
    attributes: [
      { name: 'GPU', value: 'NVIDIA GeForce RTX 4060' },
      { name: 'VRAM', value: '8 Go GDDR6' },
      { name: 'Interface', value: 'PCIe 4.0 x8' },
      { name: 'Alimentation', value: '1x 8-pin' },
    ],
  },
  {
    name: 'ASUS ROG STRIX B650-A',
    slug: 'asus-rog-strix-b650-a',
    description: 'Carte mère AMD AM5 haute performance pour processeurs Ryzen 7000.',
    sku: 'ASUS-B650A-AM5',
    ean: '1234567890127',
    brandSlug: 'asus',
    categorySlug: 'composants',
    priceHt: 249.0,
    taxRate: 20,
    stockQuantity: 6,
    featured: false,
    attributes: [
      { name: 'Socket', value: 'AMD AM5' },
      { name: 'Chipset', value: 'AMD B650' },
      { name: 'Format', value: 'ATX' },
      { name: 'RAM', value: 'DDR5 jusqu\'à 128 Go' },
    ],
  },
  {
    name: 'Samsung 990 PRO 1To',
    slug: 'samsung-990-pro-1to',
    description:
      'SSD NVMe PCIe 4.0 ultra-rapide avec vitesses de lecture jusqu\'à 7450 Mo/s.',
    sku: 'SAM-990PRO-1TB',
    ean: '1234567890128',
    brandSlug: 'samsung',
    categorySlug: 'stockage',
    priceHt: 119.0,
    taxRate: 20,
    stockQuantity: 25,
    featured: true,
    attributes: [
      { name: 'Capacité', value: '1 To' },
      { name: 'Interface', value: 'NVMe PCIe 4.0 x4' },
      { name: 'Lecture', value: '7450 Mo/s' },
      { name: 'Écriture', value: '6900 Mo/s' },
    ],
  },

  // Périphériques
  {
    name: 'Dell UltraSharp U2723QE',
    slug: 'dell-ultrasharp-u2723qe',
    description: 'Moniteur 4K 27" USB-C IPS avec hub intégré. Idéal pour le travail créatif.',
    sku: 'DELL-U2723QE',
    ean: '1234567890129',
    brandSlug: 'dell',
    categorySlug: 'peripheriques',
    priceHt: 549.0,
    taxRate: 20,
    stockQuantity: 5,
    featured: true,
    attributes: [
      { name: 'Taille', value: '27 pouces' },
      { name: 'Résolution', value: '3840 x 2160 (4K)' },
      { name: 'Dalle', value: 'IPS Black' },
      { name: 'USB-C', value: '90W Power Delivery' },
    ],
  },
  {
    name: 'HP LaserJet Pro M404dn',
    slug: 'hp-laserjet-pro-m404dn',
    description:
      'Imprimante laser monochrome professionnelle avec recto-verso automatique.',
    sku: 'HP-LJP-M404DN',
    ean: '1234567890130',
    brandSlug: 'hp',
    categorySlug: 'peripheriques',
    priceHt: 299.0,
    taxRate: 20,
    stockQuantity: 10,
    featured: false,
    attributes: [
      { name: 'Type', value: 'Laser monochrome' },
      { name: 'Vitesse', value: '40 ppm' },
      { name: 'Recto-verso', value: 'Automatique' },
      { name: 'Réseau', value: 'Ethernet' },
    ],
  },

  // Réseau
  {
    name: 'TP-Link Archer AX73',
    slug: 'tp-link-archer-ax73',
    description:
      'Routeur WiFi 6 dual-band haute performance jusqu\'à 5400 Mbps.',
    sku: 'TPL-AX73',
    ean: '1234567890131',
    brandSlug: 'tp-link',
    categorySlug: 'reseau',
    priceHt: 129.0,
    taxRate: 20,
    stockQuantity: 18,
    featured: true,
    attributes: [
      { name: 'Standard', value: 'WiFi 6 (802.11ax)' },
      { name: 'Débit', value: '5400 Mbps' },
      { name: 'Ports', value: '1 WAN + 4 LAN Gigabit' },
      { name: 'USB', value: '1x USB 3.0' },
    ],
  },
  {
    name: 'TP-Link TL-SG108',
    slug: 'tp-link-tl-sg108',
    description: 'Switch 8 ports Gigabit métal compact et silencieux.',
    sku: 'TPL-SG108',
    ean: '1234567890132',
    brandSlug: 'tp-link',
    categorySlug: 'reseau',
    priceHt: 24.0,
    taxRate: 20,
    stockQuantity: 50,
    featured: false,
    attributes: [
      { name: 'Ports', value: '8x Gigabit Ethernet' },
      { name: 'Type', value: 'Non manageable' },
      { name: 'Boîtier', value: 'Métal' },
    ],
  },

  // Stockage
  {
    name: 'Western Digital Red Plus 4To',
    slug: 'wd-red-plus-4to',
    description: 'Disque dur NAS 3.5" optimisé pour les systèmes RAID.',
    sku: 'WD-RED-4TB',
    ean: '1234567890133',
    brandSlug: 'western-digital',
    categorySlug: 'stockage',
    priceHt: 109.0,
    taxRate: 20,
    stockQuantity: 15,
    featured: false,
    attributes: [
      { name: 'Capacité', value: '4 To' },
      { name: 'Format', value: '3.5"' },
      { name: 'Vitesse', value: '5400 RPM' },
      { name: 'Usage', value: 'NAS 24/7' },
    ],
  },
  {
    name: 'Seagate Expansion 2To',
    slug: 'seagate-expansion-2to',
    description: 'Disque dur externe USB 3.0 portable. Plug & Play.',
    sku: 'SEA-EXP-2TB',
    ean: '1234567890134',
    brandSlug: 'seagate',
    categorySlug: 'stockage',
    priceHt: 69.0,
    taxRate: 20,
    stockQuantity: 30,
    featured: false,
    attributes: [
      { name: 'Capacité', value: '2 To' },
      { name: 'Interface', value: 'USB 3.0' },
      { name: 'Format', value: '2.5" portable' },
    ],
  },
]

const users = [
  {
    email: 'admin@boom-informatique.fr',
    passwordHash: PLACEHOLDER_PASSWORD_HASH,
    role: 'admin' as const,
    firstName: 'Admin',
    lastName: 'System',
    isValidated: true,
  },
  {
    email: 'client@example.com',
    passwordHash: PLACEHOLDER_PASSWORD_HASH,
    role: 'customer' as const,
    firstName: 'Jean',
    lastName: 'Dupont',
    phone: '0612345678',
    isValidated: true,
  },
  {
    email: 'pro@entreprise.fr',
    passwordHash: PLACEHOLDER_PASSWORD_HASH,
    role: 'pro' as const,
    firstName: 'Marie',
    lastName: 'Martin',
    phone: '0698765432',
    companyName: 'Tech Solutions SARL',
    siret: '12345678901234',
    vatNumber: 'FR12345678901',
    isValidated: true,
    discountRate: 10,
  },
]

async function seed() {
  console.log('Seeding database...')

  // This is a placeholder - in production you would use the actual D1 connection
  // For now, this script generates SQL that can be run manually
  console.log('\n-- SQL to insert categories --')
  for (const cat of categories) {
    console.log(
      `INSERT INTO categories (name, slug, image_url, position) VALUES ('${cat.name}', '${cat.slug}', '${cat.imageUrl}', ${cat.position});`
    )
  }

  console.log('\n-- SQL to insert brands --')
  for (const brand of brands) {
    console.log(
      `INSERT INTO brands (name, slug, logo_url) VALUES ('${brand.name}', '${brand.slug}', '${brand.logoUrl}');`
    )
  }

  console.log('\n-- SQL to insert users --')
  for (const user of users) {
    console.log(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, company_name, siret, vat_number, is_validated, discount_rate) VALUES ('${user.email}', '${user.passwordHash}', '${user.role}', ${user.firstName ? `'${user.firstName}'` : 'NULL'}, ${user.lastName ? `'${user.lastName}'` : 'NULL'}, ${user.phone ? `'${user.phone}'` : 'NULL'}, ${user.companyName ? `'${user.companyName}'` : 'NULL'}, ${user.siret ? `'${user.siret}'` : 'NULL'}, ${user.vatNumber ? `'${user.vatNumber}'` : 'NULL'}, ${user.isValidated ? 1 : 0}, ${user.discountRate || 0});`
    )
  }

  console.log('\n-- SQL to insert products (run after categories and brands) --')
  console.log('-- You need to replace category_id and brand_id with actual IDs --')
  for (const product of products) {
    const priceTtc = product.priceHt * (1 + product.taxRate / 100)
    console.log(`
-- Product: ${product.name}
INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active)
SELECT '${product.name.replace(/'/g, "''")}', '${product.slug}', '${product.description.replace(/'/g, "''")}', '${product.sku}', '${product.ean}', b.id, c.id, ${product.priceHt}, ${product.taxRate}, ${priceTtc.toFixed(2)}, ${product.stockQuantity}, ${product.featured ? 1 : 0}, 1
FROM brands b, categories c
WHERE b.slug = '${product.brandSlug}' AND c.slug = '${product.categorySlug}';
`)

    for (const attr of product.attributes) {
      console.log(`
INSERT INTO product_attributes (product_id, name, value)
SELECT p.id, '${attr.name}', '${attr.value.replace(/'/g, "''")}'
FROM products p WHERE p.sku = '${product.sku}';`)
    }
  }

  console.log('\n\nSeed data generation complete!')
  console.log(
    'Run the SQL statements above against your D1 database using wrangler d1 execute'
  )
}

seed().catch(console.error)
