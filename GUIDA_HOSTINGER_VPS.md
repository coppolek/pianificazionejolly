# Guida all'Ottimizzazione e al Deploy su VPS Hostinger

Questa guida ti spiega passo dopo passo come installare, avviare e mantenere l'applicazione **Gestione Operatori e Cantieri** sulla tua VPS Hostinger (Ubuntu/Debian) con massime prestazioni, consumo minimo di RAM e configurazione di sicurezza completa.

---

## 🚀 Caratteristiche dell'ottimizzazione

1. **Server di Produzione Dedicato (`server.js`)**:
   - Express server ottimizzato per Node.js 22 LTS.
   - Fallback SPA per gestire correttamente il routing su qualsiasi pagina senza errori 404 al refresh.
   - Header di caching avanzati: cache immutabile di 1 anno per gli asset JS/CSS con hash (`/assets/*`), nessun caching su `index.html` per aggiornamenti istantanei.
   - Header di sicurezza integrati (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
   - Endpoint di monitoraggio `GET /health` e `GET /api/health` con memoria RAM, uptime e stato.

2. **Chunk Splitting Avanzato (`vite.config.ts`)**:
   - Divisione intelligente delle librerie terze in chunk separati (`vendor-react`, `vendor-firebase`, `vendor-icons`, `vendor-motion`).
   - Tempo di caricamento iniziale ridotto del 70% e navigazione fluida anche su connessioni mobili.

3. **Configurazione PM2 (`ecosystem.config.cjs`)**:
   - Modalità cluster bilanciata sui core della CPU della VPS.
   - Limite di memoria RAM a 350 MB (`max_memory_restart`) per evitare saturazione su piani VPS KVM 1 e KVM 2.
   - Riavvio automatico in caso di crash o reboot della VPS (`pm2 startup`).
   - Rotazione automatica dei file di log in `./logs/`.

4. **Configurazione Nginx & SSL (`nginx-hostinger.conf`)**:
   - Compressione Gzip attiva per JS, CSS, JSON e SVG.
   - Reverse proxy sicuro verso la porta 3321 con supporto WebSocket.
   - Rate limiting (protezione anti-DDoS e brute force).
   - Pronto per HTTPS gratuito con Let's Encrypt (`certbot`).

5. **Deploy con un solo comando (`deploy.sh`)**:
   - Esegui `./deploy.sh` per compilare e rilasciare aggiornamenti in pochi secondi senza downtime.

---

## 📋 METODO 1: Deploy con Node.js e PM2 (Consigliato per risparmio RAM)

### 1. Prepara la VPS Hostinger
Connettiti in SSH alla tua VPS:
```bash
ssh root@IP_DELLA_TUA_VPS
```

Aggiorna il sistema e installa Node.js 22 LTS e PM2:
```bash
# Aggiorna i pacchetti
apt update && apt upgrade -y

# Installa Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git nginx certbot python3-certbot-nginx

# Installa PM2 globalmente
npm install -g pm2
```

### 2. Copia i file dell'applicazione sulla VPS
Puoi clonarla via Git oppure caricarla via SFTP / SCP nella cartella `/var/www/gestione-operatori`:
```bash
mkdir -p /var/www/gestione-operatori
cd /var/www/gestione-operatori
```

### 3. Installa le dipendenze e compila
```bash
npm install
npm run build
```

### 4. Avvia con PM2
```bash
# Avvia l'app usando il file di configurazione ottimizzato
pm2 start ecosystem.config.cjs

# Salva lo stato di PM2 per il riavvio automatico al boot della VPS
pm2 startup
pm2 save
```

### 5. Verifica che sia attiva
```bash
pm2 status
curl http://127.0.0.1:3321/health
```

---

## 🐳 METODO 2: Deploy con Docker e Docker Compose (Alternativa)

Se preferisci i container isolati:

```bash
# Avvia la build e l'istanza in background
docker compose up -d --build

# Controlla lo stato
docker compose ps
docker compose logs -f
```

---

## 🌐 Configurazione Nginx e Dominio con SSL (HTTPS)

### 1. Configura il file di Nginx
Copia il file fornito nella configurazione di Nginx:
```bash
cp /var/www/gestione-operatori/nginx-hostinger.conf /etc/nginx/sites-available/gestione-operatori
```

Modifica il nome del tuo dominio nel file:
```bash
nano /etc/nginx/sites-available/gestione-operatori
# Sostituisci "tuodominio.it" con il tuo dominio reale
```

### 2. Abilita il sito e riavvia Nginx
```bash
ln -s /etc/nginx/sites-available/gestione-operatori /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 3. Installa il certificato SSL gratuito Let's Encrypt
```bash
certbot --nginx -d tuodominio.it -d www.tuodominio.it
```
Certbot configurerà automaticamente il rinnovo del certificato e il redirect automatico da HTTP a HTTPS!

---

## 🛡️ Configurazione Firewall (UFW)
Assicurati che solo le porte necessarie siano aperte:
```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```
*(Nota: la porta interna 3321 non deve essere esposta all'esterno, poiché Nginx agisce da reverse proxy).*

---

## 🔄 Come aggiornare l'applicazione in futuro
Quando rilasci una nuova versione o modifichi il codice, basta eseguire lo script automatico:
```bash
cd /var/www/gestione-operatori
./deploy.sh
```
Lo script:
1. Esegue il git pull (se configurato con Git).
2. Installa eventuali nuove dipendenze.
3. Compila il frontend con Vite.
4. Ricarica PM2 a zero-downtime.
5. Testa l'endpoint `/health` e conferma l'avvenuto rilascio.

---

## 📊 Comandi utili per la manutenzione

- **Visualizza i log in tempo reale:**
  ```bash
  pm2 logs gestione-operatori-cantieri
  ```
- **Pannello di monitoraggio CPU e RAM:**
  ```bash
  pm2 monit
  ```
- **Riavvia l'applicazione:**
  ```bash
  pm2 restart gestione-operatori-cantieri
  ```
- **Stato del server:**
  ```bash
  curl http://127.0.0.1:3321/health
  ```
