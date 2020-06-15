const log = require("log4js").getLogger("PlugBoard");

function isObject(obj) {
  if (!obj || Object.prototype.toString.call(obj) !== "[object Object]") {
    return false;
  }
  return true;
}

function isFunction(fn) {
  const toString = Object.prototype.toString;
  const rest = toString.call(fn);
  if (
    rest === "[object Function]" ||
    rest === "[object AsyncFunction]" ||
    rest === "[object GeneratorFunction]"
  ) {
    return true;
  }
  return false;
}

function load(path, isIgnore = false) {
  try {
    // eslint-disable-next-line global-require
    const moduel = require(path); // eslint-disable-line import/no-dynamic-require
    return moduel;
  } catch (err) {
    if (isIgnore === false) {
      throw new Error(`it has a error ${err.message} at the loading ${path}`);
    }
  }
  return null;
}

function deepExtend(...sources) {
  let target = {};
  sources.forEach((source) => {
    if (!isObject(source)) {
      target = source;
      return;
    }
    Object.keys(source).forEach((key) => {
      const src = target[key];
      const copy = source[key];
      if (src === copy) return;

      if (isObject(src)) {
        target[key] = deepExtend(src, copy);
      } else {
        target[key] = copy;
      }
    });
  });
  return target;
}

/**
 * find the config file in the specified path
 *
 * the env config is prior if it is exist
 *
 * @param {string} configPath
 * @param {string} env
 * @return {Object} merged config
 */
function loadConfig(configPath, app, env) {
  let config;
  let configEnv;
  let configEnvFn;
  const configFn = load(`/${configPath}/config`, true);

  logger(`will load env ${env} file`);
  if (env) {
    logger(`loading env ${env} file`);
    configEnvFn = load(`/${configPath}/config.${env}`, true);
    logger(`had load env ${env} file, isFunction ${isFunction(configEnvFn)}`);
  }

  if (isFunction(configFn)) {
    config = configFn(app);
  }
  if (isFunction(configEnvFn)) {
    configEnv = configEnvFn(app);
    logger(`env ${env} file : %j`, configEnv);
  }

  return deepExtend(config || {}, configEnv || {});
}

function translateCame(val) {
  return val.split("-").reduce((target, v, index) => {
    if (index === 0) return v;
    return target + v[0].toUpperCase() + v.substring(1);
  });
}

function logger(...arg) {
  log.log(...arg);
  // console.log(...arg);
}

exports.isFunction = isFunction;
exports.load = load;
exports.logger = logger;
exports.loadConfig = loadConfig;
exports.deepExtend = deepExtend;
exports.translateCame = translateCame;
