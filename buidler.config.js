
// Mute compiler warnings - this will need to be addressed properly in
// the Buidler plugin by overloading TASK_COMPILE_COMPILE.
const originalLog = console.log;
console.warn = () => {};
console.log = val => val === '\n' ? null : originalLog(val);

module.exports = {
  solc: {
    version: "0.5.8"
  },
  paths: {
    artifacts: "./test/artifacts",
    cache: "./test/cache",
    test: "./test/units",
    sources: "./test/sources/contracts",
  }
}
