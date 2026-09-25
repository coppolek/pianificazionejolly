module.exports = {
  apps: [
    {
      name: 'gestione-operatori-cantieri',
      script: 'server.js',
      instances: 'max', // Utilizza tutti i core della CPU della VPS Hostinger
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '350M', // Riavvia se consuma troppa RAM (ideale per VPS KVM 1/2)
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOST: '0.0.0.0',
      },
      // Configurazione log
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};
