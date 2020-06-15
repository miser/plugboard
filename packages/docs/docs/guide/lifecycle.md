---
sidebarDepth: 2
---

# 生命周期

在 PlugBoard 中有 2 种生命周期：

**1. 服务生命周期：** 一个服务的启动过程，包含开始启动、加载环境、加载 package.json、加载插件、设置插件配置、执行插件生命周期等。

**2. 插件生命周期：** 一个插件的的执行，包含设置配置、willRun（即将运行）、run（运行）、hadRun（已运行）和 close（关闭）。

## 服务生命周期

### PlugBoard Class

- **EventEmitter** 的子类，实现了`服务生命周期`的所有功能
- 参数：`options`
  <br />
  **config：** 配置对象，它的优先级高于文件配置，默认 {}
  <br />
  **disableReadConfig：** 禁用文件配置，默认`false` 不禁用

### start

- 启动入口，后续的 load 等方法都在此一一执行

### loadEnv

- 创建 **env.config** 对象
- **env.config.appPath:** 项目绝对路径
- **env.config.frameworkPath:** PlugBoard 模块的绝对路径

### loadPkg

- **pkg：** 读取项目的`package.json`文件

### laodConfigAndPlugin

- 加载配置文件夹下的默认配置和环境配置（根据`环境变量`）文件，合并成一个`基础配置对象`，优先级 `构造函数config参数 > 启动目录 > 项目目录 > PlugBoard 配置`

- 遍历`基础配置对象`中声明的 **plugins**

  - 加载此 plugin 模块
  - 加载此 plugin 的默认配置和环境配置文件，合并它们
  - 合并此 plugin 配置与 `基础配置对象`，优先级 `基础配置对象 > plugin 配置`
  - 将此 plugin 注册进 PlugBoard plugins 里

- **config:** 最后和`构造函数config参数`合并出一个当前程序的最终配置项

### setConfig

- 遍历 **plugins** 对象，从 **config[plugin name]** 中取出对应的插件配置并赋给该插件

### willRun

- `start` 方法的最后一个方法，至此开始进入所有插件的生命周期

## 插件周期

**\* 注**：虽然目前已经定义了几个周期名称，然而只有在多个插件联合起来使用的时候才体现出它的价值，从某种意义上来说，对整个应用过程做了横向的切割。

假设某个业务场景：一个 SSR 服务，根据配置中心的部署版本列表（服务同时可能需要部署多个版本），该服务会自动下载这些资源并进行热更新；端渲染资源以版本号存放在服务器的不同目录中，当用户访问服务时，根据逻辑提供 A/B 测试功能。

@flowstart
start=>start: 获取远端全局版本配置
check_cond=>condition: 算出远端和本地版本差异
fetch_process=>operation: 拉取新增版本的 SSR 文件到本地磁盘
parse_process=>operation: 对新版本做路由解析
end=>end: 移除本地废弃 SSR 文件

start->check_cond
check_cond(yes)->fetch_process->parse_process->end
check_cond(no)->end
@flowend

下表就是对上面所列需求的纵向和横向的切分

| 插件周期 | FetchConfigPlugin 插件                                  | ManageAssetPlugin 插件                       | ParseRouterPlugin 插件 |
| -------- | ------------------------------------------------------- | -------------------------------------------- | ---------------------- |
| willRun  | 获取远端全局版本配置，将配置信息挂到上下文对象上（ctx） | 获取版本，并从上下文对象中获取全局版本配置异 |                        |
| run      |                                                         | 拉取新增版本的 SSR 文件到本地磁盘            |                        |
| hadRun   |                                                         |                                              | 对新版本做路由解析     |
| close    |                                                         | 移除本地废弃 SSR 文件                        |                        |

我们可以发现，切分后，逻辑变得很清晰，团队内部根据事先的协商，哪些功能写在`willRun`里，哪些写在`run`里，等等。将散落在各个“时间点”的功能通过 PlugBoard 配置出一个完整的业务应用，更好的分配任务、功能解耦和测试等。

伪代码：

```javascript
// 获取远端配置 插件
// fetch-config-plugin
const { Plugin } = require("@plugboard/core");

class FetchConfigPlugin extends Plugin {
  constructor(opt) {
    super(opt);
    this.name = "fetch-config";
  }

  async willRun() {
    const vers = await this.fetch();
    this.ctx.vers = vers;
  }

  async fetch() {
    return ["v2", "v3"];
  }
}

module.exports = FetchConfigPlugin;
```

```javascript
// 拉取静态资源 插件
// fetch-asset-plugin
const { Plugin } = require("@plugboard/core");

class ManageAssetPlugin extends Plugin {
  constructor(app) {
    super(app);
    this.name = "manage-asset";

    this.oldVers = null;
    this.newVers = null;
  }

  willRun() {
    this.currentVers = this.initCurrentVers();
  }

  initCurrentVers() {
    return ["v1", "v2"];
  }

  async run() {
    const vers = this.ctx.vers; // 从之前一个插件获取的全局版本

    const { oldVers, newVers } = this.diffVersions(vers);

    this.oldVers = oldVers;
    this.newVers = newVers;

    await this.fetchAssets(newVers);
  }

  diffVersions(vers = []) {
    // 算出 this.currentVers 和 vers 的不同版本
    return {
      newVers, // newVers 此处为 ['v3']
      oldVers, // oldVers 此处为 ['v1']
    };
  }

  async fetchAssets(vers) {
    // 拉取资源
  }

  async close() {
    // 移除 v1版本的本地资源
  }
}

module.exports = ManageAssetPlugin;
```

```javascript
// 路由解析 插件
// parse-router-plugin
const { Plugin } = require("@plugboard/core");

async function parseRouter(vers) {
  // 返回根据SSR静态资源，解析出对应版本的路由规则
}

class ParseRouterPlugin extends Plugin {
  async hadRun() {
    const vers = this.ctx.vers;
    const routers = await parseRouter(vers);

    this.ctx.routers = routers;
  }
}

module.exports = ParseRouterPlugin;
```

**总结**，插件的生命周期并不是一个硬性编写插件的“规范”，而是插件与插件之间、团队内部之间协商的一个“规范”。通过`时间点`的协商，可以把应用横向划分，**PlugBoard** 只是将这些`时间点`井然有序的串行起来，一步步执行。
