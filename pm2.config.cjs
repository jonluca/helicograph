module.exports = {
  apps: [
    {
      name: "monitor",
      script: "yarn monitor",
      max_restarts: 10,
      restart_delay: 60 * 1000 * 15,
      log_date_format: "YYYY-MM-DD HH:mm Z",
    },
  ],
};
