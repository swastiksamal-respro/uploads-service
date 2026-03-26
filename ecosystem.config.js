module.exports = {
  apps: [
    {
      name: "upload.reseapro.com",
      script: "app.js",
      env: {
        NODE_ENV: "development",
        PORT: 3014
      }
    }
  ]
};
