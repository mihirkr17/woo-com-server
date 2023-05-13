const nCache = require("node-cache");

const cache = new nCache({ stdTTL: 600 });

class NodeCache {
  constructor() { }

  saveCache(key: any, value: any, ttl: any) {
    let sCResult = cache.set(key, JSON.stringify(value), ttl);
    if (sCResult) return true;
  }

  getCache(key: any) {
    let gC = cache.get(key);

    if (typeof gC === "undefined") {
      return null;
    }

    gC = JSON.parse(gC);
    return gC;
  }

  deleteCache(key: any) {
    return cache.del(key);
  }
}

module.exports = new NodeCache();