const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    ...(process.env.NODE_ENV === "production" && !process.env.DEBUG ? { cssnano: {} } : {}),
  },
};

module.exports = config;
