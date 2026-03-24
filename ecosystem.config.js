module.exports = {
  apps: [
    {
      name: "immigration-portal",
      cwd: "/home/farhan/Immigration_portal",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 3002,
      },
      max_memory_restart: "512M",
      autorestart: true,
      watch: false,
      merge_logs: true,
      error_file: "/home/farhan/.pm2/logs/immigration-portal-error.log",
      out_file: "/home/farhan/.pm2/logs/immigration-portal-out.log",
    },
  ],
};
