var Web3 = require('web3');
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

var shell = require('shelljs');
var SolidityCoder = require("web3/lib/solidity/coder.js");
var fs = require('fs');
var path = require('path');
var getInstrumentedVersion = require('./instrumentSolidity.js');
var CoverageMap = require('./coverageMap.js');
var coverage = new CoverageMap();
var mkdirp = require('mkdirp');

var childprocess = require('child_process');

//PAtch our local testrpc if necessary
if (!shell.test('-e','./node_modules/ethereumjs-vm/lib/opFns.js.orig')){
    console.log('patch local testrpc...')
    shell.exec('patch -b ./node_modules/ethereumjs-vm/lib/opFns.js ./hookIntoEvents.patch')
}
//Run the modified testrpc with large block limit
var testrpcProcess = childprocess.exec('./node_modules/ethereumjs-testrpc/bin/testrpc --gasLimit 0xfffffffffffff --gasPrice 0x1')

if (shell.test('-d','../originalContracts')){
    console.log("There is already an 'originalContracts' directory in your truffle directory.\nThis is probably due to a previous solcover failure.\nPlease make sure the ./contracts/ directory contains your contracts (perhaps by copying them from originalContracts), and then delete the originalContracts directory.")
    process.exit(1);
}

shell.mv('./../contracts/', './../originalContracts/');
shell.mkdir('./../contracts/');
//For each contract in originalContracts, get the instrumented version
shell.ls('./../originalContracts/**/*.sol').forEach(function(file) {
    if (file !== 'originalContracts/Migrations.sol') {
        var canonicalContractPath = path.resolve(file);

        console.log("instrumenting ", canonicalContractPath);
        var contract = fs.readFileSync(canonicalContractPath).toString();
        var instrumentedContractInfo = getInstrumentedVersion(contract, canonicalContractPath, true);
        mkdirp.sync(path.dirname(canonicalContractPath.replace('originalContracts', 'contracts')));
        fs.writeFileSync(canonicalContractPath.replace('originalContracts','contracts'), instrumentedContractInfo.contract);
        coverage.addContract(instrumentedContractInfo, canonicalContractPath);
    }
});
shell.cp("./../originalContracts/Migrations.sol", "./../contracts/Migrations.sol");

shell.rm('./allFiredEvents'); //Delete previous results
shell.exec('truffle test --network test');

events = fs.readFileSync('./allFiredEvents').toString().split('\n')
events.pop();
//The pop here isn't a bug - there is an empty line at the end of this file, so we
//don't want to include it as an event.
coverage.generate(events, './../originalContracts/');

fs.writeFileSync('./coverage.json', JSON.stringify(coverage.coverage));

shell.exec("./node_modules/istanbul/lib/cli.js report lcov")
testrpcProcess.kill();
shell.rm('-rf', './../contracts');
shell.mv('./../originalContracts', './../contracts');
