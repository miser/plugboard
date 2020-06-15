const path = require("path");
const assert = require("assert");
const sinon = require("sinon");
const PluginBoard = require("../index");
// const { pathToFileURL } = require("url");
// const { allowsCall } = require("sinon/lib/sinon/mock-expectation");

const START_PROGRAM_CONFIG = Symbol.for("START_PROGRAM_CONFIG");

const { Service, Plugin } = PluginBoard;

describe("service", () => {
  before(() => {});

  describe("disable read config file", () => {
    let loadStartConfigSpy;
    beforeEach(() => {
      loadStartConfigSpy = sinon.spy(Service.prototype, START_PROGRAM_CONFIG);
    });
    afterEach(() => {
      loadStartConfigSpy.restore();
    });

    it("options", () => {
      let service = new Service();
      assert(service.disableReadConfig === false);

      // not read
      service = new Service({
        disableReadConfig: true,
      });
      assert(service.disableReadConfig === true);
    });

    it("call load config file", async () => {
      const service = new Service();
      await service.start();
      assert(service[START_PROGRAM_CONFIG].callCount === 1);
    });

    it("not call load config file", async () => {
      const service = new Service({ disableReadConfig: true });
      await service.start();
      assert(service[START_PROGRAM_CONFIG].callCount === 0);
    });
  });

  describe("plugins", () => {
    it("entry config", async () => {
      class TestPlugin extends Plugin {
        constructor(opts) {
          super(opts);
          this.name = "test-plugin";
        }
      }

      let testPlugin;

      const plugins = {
        testPlugin: {
          enable: true,
          entry: (ser) => {
            assert(ser === service);
            testPlugin = new TestPlugin(ser);
            return testPlugin;
          },
        },
      };
      const service = new Service({
        disableReadConfig: true,
        config: {
          plugins,
        },
      });

      await service.start();

      // register sucess
      assert(service.plugins.get("test-plugin") === testPlugin);
    });
  });

  describe("merge config", () => {
    it("default", async () => {
      const service = new Service({
        startPath: path.join(__dirname, "mockApp"),
      });

      await service.start();

      const {
        sessionTimeout,
        fetchMaxBytes,
        encoding,
        host,
      } = service.config.fetchConfig;

      assert(sessionTimeout === 15000);
      assert(fetchMaxBytes === 1024 * 1024);
      assert(encoding === "utf8");

      assert(host === undefined);
    });

    it("prod", async () => {
      const service = new Service(
        {
          startPath: path.join(__dirname, "mockApp"),
        },
        "prod"
      );

      await service.start();

      const {
        sessionTimeout,
        fetchMaxBytes,
        encoding,
        host,
      } = service.config.fetchConfig;

      assert(sessionTimeout === 15000);
      assert(fetchMaxBytes === 1024 * 1024);
      assert(encoding === "utf8");

      assert(host === "prod mq host");
    });
  });
});
