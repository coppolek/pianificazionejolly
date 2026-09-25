# ==========================================
# STAGE 1: Build Frontend & Assets
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Installa dipendenze per compilazione
COPY package.json package-lock.json ./
RUN npm ci

# Copia sorgenti
COPY . .

# Compila l'applicazione per la produzione
RUN npm run build

# ==========================================
# STAGE 2: Lightweight Production Runner
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Installa wget per healthcheck
RUN apk add --no-cache wget

# Copia solo package.json ed esegui installazione minima di produzione
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copia i file compilati dallo stage builder
COPY --from=builder /app/dist ./dist
COPY server.js ./
COPY firebase-applet-config.json ./

# Crea cartella logs con permessi per l'utente non-root
RUN mkdir -p logs && chown -R node:node /app

USER node

EXPOSE 3000

# Controllo dello stato del container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

CMD ["node", "server.js"]
