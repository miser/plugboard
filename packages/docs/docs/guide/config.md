---
sidebarDepth: 2
---

# 环境配置

无论是插件还是应用，都会在根目录下有个`config`目录，PlugBoard 会加载它们其中的 `config.js` 和 `config.${env}.js` 文件，合并成最后的配置对象。

> **启动目录（默认应用根目录） > plugin**

## 加载配置

### 默认

仅加载 `config.js` 文件

```javascript
module.exports = (board) => {
  // board 当前 PlugBoard 实例
  const config = {};
  return config;
};
```

### 加载不同环境的方式

- 方式一：在初始化 PlugBoard 时候传参

```javascript
const service = new Service({}, "prod"); // 加载 prod 环境配置
```

- 方式二：在启动项目的`config`目录里添加`env`文件（比传参的权限更高，会覆盖传参）

```
// 目录结构
project
└───config
│   │   env
│   │   config.js
│   │   config.prod.js
```

```
// env 文件
prod
```

通过上面 2 个方法都能将当前的启动环境配置成`prod`，在程序运行的时候，比如当前 App 的根目录是`App/`，另外有个`FetchConfigPlugin`插件需要加载，那么将会读取 `App/config/config.prod.js`、`App/config/config.js`、`FetchConfigPlugin/config/config.prod.js`和`FetchConfigPlugin/config/config.js`文件，并依次合并里面的配置项，权重从高到低。（不存在的配置文件会跳过）

## 加载插件

```js
module.exports = (board) => {
  const config = {};
  config.plugins = {
    fetchConfig: {
      enable: true, // true 为打开，false 为关闭，默认为打开
      // name 和  path 二选一即可
      name: "FetchConfigPlugin", // 通过node_modules 里面去找这个FetchConfigPlugin插件
      path: "absolute/path/FetchConfigPlugin", // FetchConfigPlugin插件在本地的绝对路径， 它将覆盖name参数
    },
  };
  return config;
};
```

## 插件参数

### 规则

- 在编写插件时候，我们会给插件取名

  - 比如之前的 FetchConfigPlugin 插件，我们可以通过`this.config['fetchConfig']`读取出这个插件的最后配置信息
  - 名字会被转为`小驼峰`规则，比如 **fetch-confign** 会通过 this.config['**fetchConfig**']读取配置

```javascript
const { Plugin } = require("PlugBoard");

class FetchConfigPlugin extends Plugin {
  constructor(app) {
    super(app);
    this.name = "fetch-config";
  }
}
```

### 举例

以上文的 FetchConfig 配置为例

```javascript
// App/config/config.js
module.exports = (board) => {
  const config = {};

  config.fetchConfig = {
    sessionTimeout: 15000,
    protocol: ["roundrobin"],
    fetchMaxBytes: 1024 * 1024,
  };

  config.plugins = {
    fetchConfig: {
      enable: true,
      path: "fetchConfig absolute path",
    },
  };

  return config;
};

// App/config/config.prod.js
module.exports = () => {
  const config = {};

  config.fetchConfig = {
    host: "prod mq host",
    groupId: "prod config group id",
  };

  return config;
};

// FetchConfigPlugin/config/config.js
module.exports = () => {
  const config = {};

  config.fetchConfig = {
    sessionTimeout: 1000,
    fetchMaxBytes: 1024,
    encoding: "utf8",
  };

  return config;
};
```

合并后的 FetchConfigPlugin 配置

```js
{
  sessionTimeout: 15000,
  fetchMaxBytes: 1048576,
  encoding: 'utf8',
  protocol: [ 'roundrobin' ],
  host: 'prod mq host',
  groupId: 'prod config group id'
}
```
