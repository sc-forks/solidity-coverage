var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

var shell = require('shelljs');
var SolidityCoder = require("web3/lib/solidity/coder.js");
var coverage = {};
var fs = require('fs');
var path = require('path');
var getInstrumentedVersion = require('./instrumentSolidity.js');


shell.mkdir('./canonicalContracts/');
shell.mv('./contracts/', './originalContracts');
shell.mkdir('./contracts/');
//For each contract in originalContracts, get the canonical version and the instrumented version
shell.ls('./originalContracts/*.sol').forEach(function(file) {
    if (file !== './originalContracts/Migrations.sol') {
        var instrumentedContractInfo = getInstrumentedVersion(file, true);
        var canonicalContractInfo = getInstrumentedVersion(file, false);
        fs.writeFileSync('./canonicalContracts/' + path.basename(file), canonicalContractInfo.contract);
        fs.writeFileSync('./contracts/' + path.basename(file), instrumentedContractInfo.contract);
    }
    shell.cp("./originalContracts/Migrations.sol", "./contracts/Migrations.sol");
});

var filter = web3.eth.filter('latest');
var res = web3.currentProvider.send({
    jsonrpc: '2.0',
    method: 'eth_newFilter',
    params: [{ "fromBlock": "0x0", "toBlock": "latest" }],
    id: new Date().getTime()
});
var filterid = res.result;

shell.exec("truffle test");


//Again, once that truffle issue gets solved, we don't have to call these again here
shell.ls('./originalContracts/*.sol').forEach(function(file) {
    if (file !== './originalContracts/Migrations.sol') {
        var canonicalContractPath = path.resolve('./canonicalContracts/' + path.basename(file));
        coverage[canonicalContractPath] = { "l": {}, "path": canonicalContractPath, "s": {}, "b": {}, "f": {}, "fnMap": {}, "statementMap": {}, "branchMap": {} };
        var instrumentedContractInfo = getInstrumentedVersion(file, true);
        var canonicalContractInfo = getInstrumentedVersion(file, false);
        for (idx in instrumentedContractInfo.runnableLines) {
            coverage[canonicalContractPath]["l"][instrumentedContractInfo.runnableLines[idx]] = 0;
        }
    }
})

var res = web3.currentProvider.send({
    jsonrpc: '2.0',
    method: 'eth_getFilterChanges',
    params: [filterid],
    id: new Date().getTime()
});

events = res.result;
for (idx in res.result) {
    var event = res.result[idx];
    if (event.topics.indexOf("0xb8995a65f405d9756b41a334f38d8ff0c93c4934e170d3c1429c3e7ca101014d") >= 0) {
        var data = SolidityCoder.decodeParams(["string", "uint256"], event.data.replace("0x", ""));
        var canonicalContractPath = path.resolve('./canonicalContracts/' + path.basename(data[0]));

        coverage[canonicalContractPath]["l"][data[1].toNumber()] += 1;
    }
}

fs.writeFileSync('./coverage.json', JSON.stringify(coverage));

shell.exec("istanbul report text")

shell.rm('-rf', './contracts');
shell.rm('-rf', './canonicalContracts');
shell.mv('./originalContracts', './contracts');
