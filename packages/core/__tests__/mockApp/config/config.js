const path = require("path");

module.exports = () => {
  const config = {};

  config.fetchConfig = {
    sessionTimeout: 15000,
    fetchMaxBytes: 1024 * 1024,
  };

  config.plugins = {
    fetchConfig: {
      enable: true,
      path: path.join(__dirname, "..", "..", "mockPlugin"),
    },
  };

  return config;
};
