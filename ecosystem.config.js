module.exports = {
  apps: [
    {
      name: "portal-frontend",
      cwd: "/root/portal",
      script: "/root/portal/node_modules/.bin/next",
      args: "start -p 3001 -H 0.0.0.0",
      env: {
        NODE_ENV: "production",
        PORT: 3001,
      },
      max_memory_restart: "512M",
      autorestart: true,
      watch: false,
      merge_logs: true,
      error_file: "/root/.pm2/logs/portal-frontend-error.log",
      out_file: "/root/.pm2/logs/portal-frontend-out.log",
    },
  ],
};
