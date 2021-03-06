# 插件开发

给 **PlugBoard** 开发一个插件是非常容易的

### 举个例子

```javascript
// fetch-config-plugin
const { Plugin } = require("@plugboard/core");
const axios = require("axios");

class FetchConfigPlugin extends Plugin {
  constructor(opt) {
    super(opt);
    this.name = "fetch-config";
  }

  async willRun() {
    const vers = await this.fetch();
    this.ctx.vers = vers;
  }

  fetch() {
    return axios.get(this.config.host);
  }
}

module.exports = FetchConfigPlugin;
```

上述代码的`constructor`中有一个 name 的字段，它有一个非常重要的作用，从最终配置中找出名为`fetchConfig`的字段（如下面的配置代码），并将其赋给`FetchConfigPlugin`实例对象

```javascript
module.exports = () => {
  const config = {};

  config.fetchConfig = {
    host: "获取配置的URL地址",
  };

  config.plugins = {
    fetchConfig: {
      enable: true,
      name: "FetchConfigPlugin", // 安装在node_modules里的PlugBoard插件 —— FetchConfigPlugin
    },
  };

  return config;
};
```

### 启动服务

```javascript
const { Service } = require("@plugboard/core");

const service = new Service();
service.start();
```

上述代码就能启动带有`FetchConfigPlugin`插件的服务，根据`host`地址获取远端配置信息。
