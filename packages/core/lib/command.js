const assert = require("assert");
const ServiceBoot = require("./service");

class Command {
  constructor() {
    // 注册所有的app
    this.service = ServiceBoot;
  }
  async run(opt, callback) {
    const options = { ...opt };
    const Service = this.service;
    const service = new Service(options);
    await service.start();

    if (callback) {
      callback(service);
    }
    return service;
  }
}

module.exports = Command;
