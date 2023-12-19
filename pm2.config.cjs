module.exports = {
  apps: [
    {
      name: "monitor",
      script: "yarn monitor",
      restart_delay: 60 * 1000 * 15,
      log_date_format: "YYYY-MM-DD HH:mm Z",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
