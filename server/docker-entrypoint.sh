#!/bin/sh
# Applies the Prisma schema to the database, seeds demo data on first run,
# then starts the API server.
set -e

echo "→ Applying database schema..."
npx prisma db push --skip-generate --accept-data-loss

# Seed only when the database is empty so restarts don't wipe real data.
USER_COUNT=$(node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.count().then(c=>{process.stdout.write(String(c));return p.\$disconnect()}).catch(()=>{process.stdout.write('0')})")

if [ "$USER_COUNT" = "0" ]; then
  echo "→ Seeding demo data..."
  npm run db:seed
else
  echo "→ Database already has data ($USER_COUNT users) — skipping seed."
fi

echo "→ Starting AssetFlow API..."
exec node dist/index.js
