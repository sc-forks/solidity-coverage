const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const assert = require('assert');

function pathExists(path) { return shell.test('-e', path); }

function lineCoverage(expected=[]){
  let summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json'));
  expected.forEach(item => assert(summary[item.file].lines.pct === item.pct))
}

function coverageMissing(expected=[]){
  let summary = JSON.parse(fs.readFileSync('coverage/coverage-summary.json'));
  expected.forEach(item => assert(summary[item.file] === undefined))
}

function cleanInitialState(){
  assert(pathExists('./coverage') === false, 'should start without: coverage');
  assert(pathExists('./coverage.json') === false, 'should start without: coverage.json');
}

function coverageGenerated(truffleConfig){
  const jsonPath = path.join(truffleConfig.working_directory, "coverage.json");
  assert(pathExists('./coverage') === true, 'should gen coverage folder');
  assert(pathExists(jsonPath) === true, 'should gen coverage.json');
}

function coverageNotGenerated(truffleConfig){
  const jsonPath = path.join(truffleConfig.working_directory, "coverage.json");
  assert(pathExists('./coverage') !== true, 'should NOT gen coverage folder');
  assert(pathExists(jsonPath) !== true, 'should NOT gen coverage.json');
}

module.exports = {
  lineCoverage: lineCoverage,
  coverageMissing: coverageMissing,
  cleanInitialState: cleanInitialState,
  coverageGenerated: coverageGenerated,
  coverageNotGenerated: coverageNotGenerated,
}
