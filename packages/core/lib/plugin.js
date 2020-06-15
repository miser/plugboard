const path = require("path");
const util = require("./util");

class Plugin {
  constructor(app) {
    this.app = app || {};
    this.ctx = this.app.ctx || {};
  }

  setConfig(config) {
    this.config = config;
  }

  loadConfig(filePath) {
    const app = this.app;
    return util.loadConfig(filePath, app, app.env.cmd);
  }

  async getConfig() {
    const app = this.app;
    if (app.disableReadConfig === true || !this.path) {
      return {};
    }
    const pluginPath = path.resolve(this.path); // plugin absolute path
    const configPath = app.opts.configPath;
    const config = this.loadConfig(path.join(pluginPath, configPath));
    return config;
  }
}

module.exports = Plugin;
