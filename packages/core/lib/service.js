const EventEmitter = require("events");
const path = require("path");
const fs = require("fs");
const readPkg = require("read-pkg");
const util = require("./util");

const START_PROGRAM_CONFIG = Symbol.for("START_PROGRAM_CONFIG");

// debug
const DEFAULT_OPTS = {
  configPath: "config",
};

class Service extends EventEmitter {
  constructor(opts = {}, env) {
    super();
    this.opts = util.deepExtend(DEFAULT_OPTS, opts);
    this.ctx = {};
    this.env = {
      env: env,
    };
    this.disableReadConfig = opts.disableReadConfig || false;
    this.config = opts.config || {};
    this.plugins = new Map();
    this.lifecycle = {
      willRun: [],
      run: [],
      hadRun: [],
      close: [],
    };
  }

  // eslint-disable-next-line class-methods-use-this
  log(arg) {
    util.logger(`${arg}`);
  }

  async start() {
    await this.loadEnv();
    await this.loadPkg();
    this.laodConfigAndPlugin();
    await this.setConfig();

    await this.willRun();
  }

  loadEnv() {
    // load application system env info
    this.env.config = {
      appPath: process.cwd(), // App absolute path
      frameworkPath: path.resolve(__dirname, "../../"), // plugboard-core absolute path
    };

    if (this.env.env === undefined || this.env.env === null) {
      const { configPath, startPath } = this.opts;
      let e1 = "";
      let e2 = "";
      try {
        e1 = fs.readFileSync(
          path.join(process.cwd(), configPath, "env"),
          "utf8"
        );
      } catch (e) {}
      try {
        e2 = fs.readFileSync(path.join(startPath, configPath, "env"), "utf8");
      } catch (e) {}

      this.env.env = (e2 || e1).trim();
    }
  }

  async loadPkg() {
    this.pkg = await readPkg({ cwd: this.env.config.appPath });
  }

  loadConfig(filePath) {
    return util.loadConfig(filePath, this, this.env.env); // || this.env.cmd);
  }

  laodConfigAndPlugin() {
    /*
    frameworkConfig => load config of this.env.config.frameworkPath
    appConfig => load config of this.env.config.appPath
    */
    const { appPath, frameworkPath } = this.env.config;
    const configPath = this.opts.configPath;
    let frameworkConfig;
    let appConfig;
    let startConfig;
    if (this.disableReadConfig === true) {
      // disable config file
      frameworkConfig = {};
      appConfig = {};
      startConfig = {};
    } else {
      frameworkConfig = this.loadConfig(path.join(frameworkPath, configPath));
      appConfig = this.loadConfig(path.join(appPath, configPath));
      startConfig = this[START_PROGRAM_CONFIG]();
    }
    // merge config
    const config = util.deepExtend(
      frameworkConfig,
      appConfig,
      startConfig,
      this.config
    );

    let mainConfig = { ...config };
    Object.entries(config.plugins || {}).forEach((item) => {
      const lib = item[1];
      if (lib.enable === false) return;
      const pluginEntry = lib.entry; // example, (service) => new Plugin(service)
      let plugin;
      if (pluginEntry) {
        plugin = pluginEntry(this);
      } else {
        const libName = lib.path || lib.name; // priority node_modules
        const PluginLib = util.load(libName);
        plugin = new PluginLib(this);
        plugin.path = lib.path || this.loadPluginPath(lib.name);
      }
      plugin.originName = plugin.name; // eslint-disable-line no-underscore-dangle
      plugin.name = util.translateCame(plugin.name);

      let curPluginConfig;
      if (this.disableReadConfig === true) {
        curPluginConfig = {};
      } else {
        curPluginConfig = this.loadConfig(path.join(plugin.path, configPath));
        delete curPluginConfig.plugins;
      }
      mainConfig = util.deepExtend(curPluginConfig, mainConfig);
      this.plugins.set(plugin.originName, plugin);
    });
    this.config = mainConfig;
  }

  /**
   * get config from starting path if the starting service is not
   * in the app path or the framework path
   * @param {*} config
   */
  [START_PROGRAM_CONFIG]() {
    const { configPath, startPath } = this.opts;
    if (startPath) {
      return this.loadConfig(path.join(startPath, configPath));
    }
    return {};
  }

  /**
   * merge all config, the priority order is app > framework > plugin
   *
   * @return {Object} merged config
   */
  async setConfig() {
    let config = this.config;
    // eslint-disable-next-line no-restricted-syntax
    for (const item of this.plugins) {
      const plugin = item[1];
      const pluginConfig = await plugin.getConfig();
      const newConfig = util.deepExtend(pluginConfig, config);
      config = newConfig;
    }
    this.config = config;
    this.plugins.forEach((plugin) => {
      plugin.setConfig(this.config[plugin.name] || {});
    });

    return config;
  }

  loadPluginPath(name) {
    const dirs = [];

    dirs.push(path.join(this.env.config.appPath, "node_modules"));
    dirs.push(path.join(this.env.config.frameworkPath, "node_modules"));

    const newDir = dirs.find((dir) => fs.existsSync(path.join(dir, name)));
    if (newDir) return path.join(newDir, name);

    throw new Error(`Can not find plugin ${name} in "${dirs.join(", ")}"`);
  }

  async exec(stage) {
    // this.log(`exec ${stage}`);
    // eslint-disable-next-line no-restricted-syntax
    for (const item of this.plugins) {
      const plugin = item[1];
      if (plugin[stage]) {
        await plugin[stage]();
      }
    }
  }

  async willRun() {
    await this.exec("willRun");
    this.emit("boot-will-run", this.ctx);
    await this.run();
  }

  async run() {
    await this.exec("run");
    this.emit("boot-run", this.ctx);
    await this.hadRun();
  }

  async hadRun() {
    await this.exec("hadRun");
    this.emit("boot-had-run", this.ctx);
    await this.close();
  }

  async close() {
    await this.exec("close");
    this.emit("boot-close", this.ctx);
  }
}

module.exports = Service;
