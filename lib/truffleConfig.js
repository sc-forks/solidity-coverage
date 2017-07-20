module.exports = function truffleConfig(port, gasLimit, gasPrice) {
  return `
      module.exports = {
        networks: {
          development: {
            host: "localhost",
            network_id: "*",
            port: ${port},
            gas: ${gasLimit},
            gasPrice: ${gasPrice}
          }
        }
      };`;
};