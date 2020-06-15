const log4js = require("log4js");

const DEFAULT_LOGGER_CONFIG = {
  appenders: { PlugBoard: { type: "stdout" } },
  categories: { PlugBoard: { appenders: ["PlugBoard"], level: "info" } }
};

module.exports = function configure(options) {
  const config = options || {};
  let loggerConfig;

  // string represent level type
  if (typeof config.logger === "string") {
    loggerConfig = { ...DEFAULT_LOGGER_CONFIG };
    loggerConfig.categories.default.level = config.logger;
  } else if (typeof config.logger === "object") {
    loggerConfig = { ...DEFAULT_LOGGER_CONFIG, ...config.logger };
  } else {
    loggerConfig = { ...DEFAULT_LOGGER_CONFIG };
  }
  log4js.configure(loggerConfig);
};

module.exports.DEFAULT_LOGGER_CONFIG = DEFAULT_LOGGER_CONFIG;
