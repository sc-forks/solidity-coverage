// solc v0.4.21 will not compile using instrumentation technique for viaIR
const skipFiles = process.env.VIA_IR ? ["ContractD1.sol"] : [];

module.exports = {
 "silent": false,
 "istanbulReporter": [ "json-summary", "text"],
 "skipFiles": skipFiles
}
