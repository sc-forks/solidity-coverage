#!/usr/bin/env node
const App = require('./../lib/app.js');
const reqCwd = require('req-cwd');
const death = require('death');

const log = console.log;

const config = reqCwd.silent('./.solcover.js') || {};
const app = new App(config);

death((signal, err) => app.cleanUp(err));

app.generateCoverageEnvironment();
console.log('generated')
app.instrumentTarget();
console.log('instrumented')
app.launchTestrpc()
  .then(() => {
    app.runTestCommand();
    app.generateReport();
  })
  .catch(err => log(err));



