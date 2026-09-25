#!/usr/bin/env bash
# ==============================================================================
# Script di Deploy e Aggiornamento Rapido per VPS Hostinger
# Gestione Operatori e Cantieri
# ==============================================================================

set -e

# Colori per il terminale
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}======================================================${NC}"
echo -e "${BLUE}  🚀 Inizio deploy: Gestione Operatori e Cantieri     ${NC}"
echo -e "${BLUE}======================================================${NC}"

# 1. Se siamo in una repository git, scarica le novitÃ 
if [ -d ".git" ]; then
    echo -e "${YELLOW}[1/5] Aggiornamento codice da Git...${NC}"
    git pull --rebase || echo -e "${YELLOW}Proseguo senza aggiornamento git.${NC}"
else
    echo -e "${YELLOW}[1/5] Cartella non Git, salto git pull.${NC}"
fi

# 2. Verifica metodo di deploy (Docker vs PM2/Node standard)
if command -v docker &> /dev/null && [ -f "docker-compose.yml" ] && [ "$1" == "--docker" ]; then
    echo -e "${YELLOW}[2/5] Deploy rilevato via Docker Compose...${NC}"
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    echo -e "${GREEN}✓ Container Docker riavviato con successo!${NC}"
else
    # Deploy standard con Node.js & PM2
    echo -e "${YELLOW}[2/5] Installazione dipendenze di compilazione...${NC}"
    npm install

    echo -e "${YELLOW}[3/5] Compilazione bundle di produzione (Vite)...${NC}"
    npm run build

    echo -e "${YELLOW}[4/5] Riavvio applicazione tramite PM2...${NC}"
    mkdir -p logs

    if command -v pm2 &> /dev/null; then
        pm2 reload ecosystem.config.cjs --update-env || pm2 start ecosystem.config.cjs
        pm2 save
        echo -e "${GREEN}✓ PM2 ricaricato con successo in modalitÃ  Cluster!${NC}"
    else
        echo -e "${YELLOW}PM2 non installato globalmente. Avvio consigliato: npm start${NC}"
        echo -e "${YELLOW}Per installarlo: npm install -g pm2${NC}"
    fi
fi

# 5. Verifica stato del servizio (Health check)
echo -e "${YELLOW}[5/5] Verifica stato del server (Health Check)...${NC}"
sleep 2

HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/health || echo "error")

if [ "$HEALTH_CHECK" == "200" ]; then
    echo -e "${GREEN}======================================================${NC}"
    echo -e "${GREEN}  ✅ DEPLOY COMPLETATO CON SUCCESSO! (HTTP 200 OK)     ${NC}"
    echo -e "${GREEN}  L'applicazione Ã¨ attiva e funzionante sulla VPS.     ${NC}"
    echo -e "${GREEN}======================================================${NC}"
else
    echo -e "${RED}⚠️  Attenzione: Health check ha risposto con codice: ${HEALTH_CHECK}${NC}"
    echo -e "${YELLOW}Verifica i log con: pm2 logs gestione-operatori-cantieri${NC}"
fi
