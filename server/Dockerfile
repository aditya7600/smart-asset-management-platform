# ---- Backend image: Express + Prisma API ----
# Debian-slim base (not alpine) so Prisma's engine binaries work out of the box.
FROM node:22-bookworm-slim AS base
WORKDIR /app
# OpenSSL is required by Prisma's query engine.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# ---- Dependencies ----
FROM base AS deps
COPY package*.json ./
RUN npm install

# ---- Build ----
FROM deps AS build
COPY prisma ./prisma
RUN npx prisma generate
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Runtime ----
FROM base AS runtime
ENV NODE_ENV=production
# Bring in installed deps (incl. Prisma client + tsx for seeding) and build output.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package*.json ./
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
