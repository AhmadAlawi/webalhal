/** @type {import('pm2').StartOptions} */
module.exports = {
  apps: [
    {
      name: "alhalnewweb",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3011",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        PORT: 3011,
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3011,
      },
      error_file: "logs/pm2-error.log",
      out_file: "logs/pm2-out.log",
      merge_logs: true,
      time: true,
    },
  ],
};
