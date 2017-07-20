#!/usr/bin/env node

const fs = require('fs');
const request = require('request');

request({
  uri: 'http://localhost:8888',
  body: {
    jsonrpc: '2.0',
    method: 'web3_clientVersion',
    params: [],
    id: 0,
  },
  json: true,
}, (error, response, body) => {
  if (error) {
    console.error(error);
    process.exit(1);
  }
  fs.writeFileSync('../allFiredEvents', 'foobar');
  process.exit(0);
});
