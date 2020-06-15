module.exports = () => {
  const config = {};

  config.fetchConfig = {
    sessionTimeout: 1000,
    fetchMaxBytes: 1024,
    encoding: "utf8",
  };

  return config;
};
