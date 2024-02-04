const { createProvider } = require("hardhat/internal/core/providers/construction");
const { resolveConfig } = require("hardhat/internal/core/config/config-resolution");
const { HARDHAT_NETWORK_NAME } = require("hardhat/plugins")

// Creates a shared, minimal HH provider for use in the unit tests
exports.mochaHooks = {
  beforeAll: async function() {
    const config = await resolveConfig("./", {});
    this.provider = await createProvider(
      config,
      HARDHAT_NETWORK_NAME
    );
  }
};