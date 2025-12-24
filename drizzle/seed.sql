-- Categories
INSERT INTO categories (name, slug, image_url, position) VALUES ('Ordinateurs', 'ordinateurs', '/images/categories/computers.jpg', 1);
INSERT INTO categories (name, slug, image_url, position) VALUES ('Composants', 'composants', '/images/categories/components.jpg', 2);
INSERT INTO categories (name, slug, image_url, position) VALUES ('Périphériques', 'peripheriques', '/images/categories/peripherals.jpg', 3);
INSERT INTO categories (name, slug, image_url, position) VALUES ('Réseau', 'reseau', '/images/categories/network.jpg', 4);
INSERT INTO categories (name, slug, image_url, position) VALUES ('Stockage', 'stockage', '/images/categories/storage.jpg', 5);
INSERT INTO categories (name, slug, image_url, position) VALUES ('Logiciels', 'logiciels', '/images/categories/software.jpg', 6);

-- Brands
INSERT INTO brands (name, slug, logo_url) VALUES ('HP', 'hp', '/images/brands/hp.png');
INSERT INTO brands (name, slug, logo_url) VALUES ('Dell', 'dell', '/images/brands/dell.png');
INSERT INTO brands (name, slug, logo_url) VALUES ('Lenovo', 'lenovo', '/images/brands/lenovo.png');
INSERT INTO brands (name, slug, logo_url) VALUES ('ASUS', 'asus', '/images/brands/asus.png');
INSERT INTO brands (name, slug, logo_url) VALUES ('Acer', 'acer', '/images/brands/acer.png');
INSERT INTO brands (name, slug, logo_url) VALUES ('MSI', 'msi', '/images/brands/msi.png');
INSERT INTO brands (name, slug, logo_url) VALUES ('Samsung', 'samsung', '/images/brands/samsung.png');
INSERT INTO brands (name, slug, logo_url) VALUES ('Western Digital', 'western-digital', '/images/brands/wd.png');
INSERT INTO brands (name, slug, logo_url) VALUES ('Seagate', 'seagate', '/images/brands/seagate.png');
INSERT INTO brands (name, slug, logo_url) VALUES ('TP-Link', 'tp-link', '/images/brands/tplink.png');

-- Users
-- admin@boom-informatique.fr / admin123
INSERT INTO users (email, password_hash, role, first_name, last_name, is_validated, discount_rate, created_at)
VALUES ('admin@boom-informatique.fr', '7095f66cf84e0ab438afbd86e81769acc2b09ba1b49ad9566bd50c7abbe9f5ba$f10259d3823ff5d3edbd86fec18eee23cf69abfde88acd822df3a7010dc0dc77ae9c97f12e1b3bb3e670031acaf225f13b3dc3e772d6605d5887cbe4e4d21d4c', 'admin', 'Admin', 'System', 1, 0, strftime('%s', 'now') * 1000);

-- client@example.com / client123
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_validated, discount_rate, created_at)
VALUES ('client@example.com', '9e93bfa998620d3fac8dc2d6f205df26ca26674f85ea033058d87d9a9fec8078$4826c63a0acd2fb039d1d662e93857ddecab71b84da75baab07eb08db11de0f1524d0da59119a205c9834da52a2bc763ff9284060d4c623a57284afd3438bbdd', 'customer', 'Jean', 'Dupont', '0612345678', 1, 0, strftime('%s', 'now') * 1000);

-- pro@entreprise.fr / pro123
INSERT INTO users (email, password_hash, role, first_name, last_name, phone, company_name, siret, vat_number, is_validated, discount_rate, created_at)
VALUES ('pro@entreprise.fr', '8150fb7aeb29c795015677085168656f10576983d2b49a1ea0e072503298b0e1$ca65b1c1a238fb3b5be53932e89834f6801706e4757991d44ddcf96be7b95fd2e0f651625cc62200c21a022dd231f4b4dc87e042f0588fef29ad94888da3df51', 'pro', 'Marie', 'Martin', '0698765432', 'Tech Solutions SARL', '12345678901234', 'FR12345678901', 1, 10, strftime('%s', 'now') * 1000);

-- Products
INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'HP ProBook 450 G9', 'hp-probook-450-g9', 'Ordinateur portable professionnel 15.6" avec processeur Intel Core i5, 8 Go RAM, SSD 256 Go.', 'HP-PB450G9-I5', '1234567890123', b.id, c.id, 749.0, 20, 898.80, 15, 1, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'hp' AND c.slug = 'ordinateurs';

INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'Dell OptiPlex 3000', 'dell-optiplex-3000', 'PC de bureau compact idéal pour l''entreprise. Intel Core i3, 8 Go RAM, SSD 256 Go.', 'DELL-OPT3000-I3', '1234567890124', b.id, c.id, 549.0, 20, 658.80, 20, 0, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'dell' AND c.slug = 'ordinateurs';

INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'Lenovo ThinkPad E15', 'lenovo-thinkpad-e15', 'Laptop professionnel robuste avec clavier légendaire ThinkPad. i5, 16 Go RAM, SSD 512 Go.', 'LEN-TP-E15-I5', '1234567890125', b.id, c.id, 899.0, 20, 1078.80, 8, 1, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'lenovo' AND c.slug = 'ordinateurs';

INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'MSI GeForce RTX 4060', 'msi-geforce-rtx-4060', 'Carte graphique gaming avec architecture Ada Lovelace et DLSS 3. 8 Go GDDR6.', 'MSI-RTX4060-8G', '1234567890126', b.id, c.id, 299.0, 20, 358.80, 12, 1, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'msi' AND c.slug = 'composants';

INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'ASUS ROG STRIX B650-A', 'asus-rog-strix-b650-a', 'Carte mère AMD AM5 haute performance pour processeurs Ryzen 7000.', 'ASUS-B650A-AM5', '1234567890127', b.id, c.id, 249.0, 20, 298.80, 6, 0, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'asus' AND c.slug = 'composants';

INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'Samsung 990 PRO 1To', 'samsung-990-pro-1to', 'SSD NVMe PCIe 4.0 ultra-rapide avec vitesses de lecture jusqu''à 7450 Mo/s.', 'SAM-990PRO-1TB', '1234567890128', b.id, c.id, 119.0, 20, 142.80, 25, 1, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'samsung' AND c.slug = 'stockage';

INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'Dell UltraSharp U2723QE', 'dell-ultrasharp-u2723qe', 'Moniteur 4K 27" USB-C IPS avec hub intégré. Idéal pour le travail créatif.', 'DELL-U2723QE', '1234567890129', b.id, c.id, 549.0, 20, 658.80, 5, 1, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'dell' AND c.slug = 'peripheriques';

INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'HP LaserJet Pro M404dn', 'hp-laserjet-pro-m404dn', 'Imprimante laser monochrome professionnelle avec recto-verso automatique.', 'HP-LJP-M404DN', '1234567890130', b.id, c.id, 299.0, 20, 358.80, 10, 0, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'hp' AND c.slug = 'peripheriques';

INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'TP-Link Archer AX73', 'tp-link-archer-ax73', 'Routeur WiFi 6 dual-band haute performance jusqu''à 5400 Mbps.', 'TPL-AX73', '1234567890131', b.id, c.id, 129.0, 20, 154.80, 18, 1, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'tp-link' AND c.slug = 'reseau';

INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'TP-Link TL-SG108', 'tp-link-tl-sg108', 'Switch 8 ports Gigabit métal compact et silencieux.', 'TPL-SG108', '1234567890132', b.id, c.id, 24.0, 20, 28.80, 50, 0, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'tp-link' AND c.slug = 'reseau';

INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'Western Digital Red Plus 4To', 'wd-red-plus-4to', 'Disque dur NAS 3.5" optimisé pour les systèmes RAID.', 'WD-RED-4TB', '1234567890133', b.id, c.id, 109.0, 20, 130.80, 15, 0, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'western-digital' AND c.slug = 'stockage';

INSERT INTO products (name, slug, description, sku, ean, brand_id, category_id, price_ht, tax_rate, price_ttc, stock_quantity, featured, is_active, created_at)
SELECT 'Seagate Expansion 2To', 'seagate-expansion-2to', 'Disque dur externe USB 3.0 portable. Plug & Play.', 'SEA-EXP-2TB', '1234567890134', b.id, c.id, 69.0, 20, 82.80, 30, 0, 1, strftime('%s', 'now') * 1000
FROM brands b, categories c WHERE b.slug = 'seagate' AND c.slug = 'stockage';

-- Product images (placeholder URLs)
INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=HP+ProBook', 0, 1 FROM products WHERE sku = 'HP-PB450G9-I5';

INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=Dell+OptiPlex', 0, 1 FROM products WHERE sku = 'DELL-OPT3000-I3';

INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=ThinkPad+E15', 0, 1 FROM products WHERE sku = 'LEN-TP-E15-I5';

INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=RTX+4060', 0, 1 FROM products WHERE sku = 'MSI-RTX4060-8G';

INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=ROG+STRIX', 0, 1 FROM products WHERE sku = 'ASUS-B650A-AM5';

INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=Samsung+990', 0, 1 FROM products WHERE sku = 'SAM-990PRO-1TB';

INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=UltraSharp', 0, 1 FROM products WHERE sku = 'DELL-U2723QE';

INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=LaserJet', 0, 1 FROM products WHERE sku = 'HP-LJP-M404DN';

INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=Archer+AX73', 0, 1 FROM products WHERE sku = 'TPL-AX73';

INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=TL-SG108', 0, 1 FROM products WHERE sku = 'TPL-SG108';

INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=WD+Red', 0, 1 FROM products WHERE sku = 'WD-RED-4TB';

INSERT INTO product_images (product_id, url, position, is_main)
SELECT id, 'https://placehold.co/600x400/e2e8f0/1e293b?text=Seagate', 0, 1 FROM products WHERE sku = 'SEA-EXP-2TB';

-- Product attributes
INSERT INTO product_attributes (product_id, name, value) SELECT id, 'Processeur', 'Intel Core i5-1235U' FROM products WHERE sku = 'HP-PB450G9-I5';
INSERT INTO product_attributes (product_id, name, value) SELECT id, 'RAM', '8 Go DDR4' FROM products WHERE sku = 'HP-PB450G9-I5';
INSERT INTO product_attributes (product_id, name, value) SELECT id, 'Stockage', 'SSD 256 Go NVMe' FROM products WHERE sku = 'HP-PB450G9-I5';
INSERT INTO product_attributes (product_id, name, value) SELECT id, 'Écran', '15.6" FHD IPS' FROM products WHERE sku = 'HP-PB450G9-I5';

INSERT INTO product_attributes (product_id, name, value) SELECT id, 'Processeur', 'Intel Core i3-12100' FROM products WHERE sku = 'DELL-OPT3000-I3';
INSERT INTO product_attributes (product_id, name, value) SELECT id, 'RAM', '8 Go DDR4' FROM products WHERE sku = 'DELL-OPT3000-I3';
INSERT INTO product_attributes (product_id, name, value) SELECT id, 'Stockage', 'SSD 256 Go' FROM products WHERE sku = 'DELL-OPT3000-I3';

INSERT INTO product_attributes (product_id, name, value) SELECT id, 'GPU', 'NVIDIA GeForce RTX 4060' FROM products WHERE sku = 'MSI-RTX4060-8G';
INSERT INTO product_attributes (product_id, name, value) SELECT id, 'VRAM', '8 Go GDDR6' FROM products WHERE sku = 'MSI-RTX4060-8G';

INSERT INTO product_attributes (product_id, name, value) SELECT id, 'Socket', 'AMD AM5' FROM products WHERE sku = 'ASUS-B650A-AM5';
INSERT INTO product_attributes (product_id, name, value) SELECT id, 'Chipset', 'AMD B650' FROM products WHERE sku = 'ASUS-B650A-AM5';

INSERT INTO product_attributes (product_id, name, value) SELECT id, 'Capacité', '1 To' FROM products WHERE sku = 'SAM-990PRO-1TB';
INSERT INTO product_attributes (product_id, name, value) SELECT id, 'Interface', 'NVMe PCIe 4.0 x4' FROM products WHERE sku = 'SAM-990PRO-1TB';
INSERT INTO product_attributes (product_id, name, value) SELECT id, 'Lecture', '7450 Mo/s' FROM products WHERE sku = 'SAM-990PRO-1TB';
