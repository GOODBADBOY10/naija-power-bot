'use strict'

module.exports = {
  apps: [
    {
      name: 'naija-power-bot',
      script: 'index.js',
      instances: 1,
      exec_mode: 'fork', 
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      restart_delay: 5000, // wait 5 seconds before restarting
      max_restarts: 10, // max 10 restarts in a row before giving up
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      error_file: 'logs/pm2-error.log',
      out_file: 'logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
}