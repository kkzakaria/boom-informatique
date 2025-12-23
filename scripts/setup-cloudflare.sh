#!/bin/bash

# Script de configuration des ressources Cloudflare pour Boom Informatique
# Prérequis: wrangler installé et authentifié (wrangler login)

set -e

echo "=== Configuration Cloudflare pour Boom Informatique ==="
echo ""

# Création de la base de données D1
echo "1. Création de la base de données D1..."
DB_OUTPUT=$(npx wrangler d1 create boom-informatique-db 2>&1) || true
echo "$DB_OUTPUT"

# Extraction de l'ID de la base de données
DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id = "\K[^"]+' || true)
if [ -n "$DB_ID" ]; then
    echo "   Database ID: $DB_ID"
    echo ""
    echo "   Mettez à jour wrangler.jsonc avec cet ID"
else
    echo "   La base de données existe peut-être déjà. Vérifiez avec: wrangler d1 list"
fi
echo ""

# Création des buckets R2
echo "2. Création des buckets R2..."
echo "   - Bucket assets (images produits, logos)..."
npx wrangler r2 bucket create boom-informatique-assets 2>&1 || echo "   Le bucket existe peut-être déjà"

echo "   - Bucket docs (devis, factures PDF)..."
npx wrangler r2 bucket create boom-informatique-docs 2>&1 || echo "   Le bucket existe peut-être déjà"
echo ""

# Affichage des prochaines étapes
echo "=== Prochaines étapes ==="
echo ""
echo "1. Mettez à jour wrangler.jsonc avec le database_id de D1"
echo ""
echo "2. Créez un fichier .env.local avec:"
echo "   CLOUDFLARE_ACCOUNT_ID=<votre_account_id>"
echo "   CLOUDFLARE_API_TOKEN=<votre_api_token>"
echo "   CLOUDFLARE_D1_DATABASE_ID=$DB_ID"
echo ""
echo "3. Appliquez les migrations:"
echo "   pnpm db:push"
echo ""
echo "4. Lancez le serveur de développement:"
echo "   pnpm dev"
echo ""
echo "=== Configuration terminée ==="
