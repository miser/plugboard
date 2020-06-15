const PluginBoard = require("../../../index");
const { Plugin } = PluginBoard;

class FetchConfigPlugin extends Plugin {
  constructor(app) {
    super(app);
    this.name = "fetch-config";
  }
}

module.exports = FetchConfigPlugin;
