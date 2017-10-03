#!/usr/bin/env node

const fs = require('fs');
const request = require('request');
const fakeEvent = {"address":"6d6cf716c2a7672047e15a255d4c9624db60f215","topics":["34b35f4b1a8c3eb2caa69f05fb5aadc827cedd2d8eb3bb3623b6c4bba3baec17"],"data":"00000000000000000000000000000000000000000000000000000000000000400000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000003a2f55736572732f757365722f53697465732f73632d666f726b732f6d657461636f696e2f636f6e7472616374732f4d657461436f696e2e736f6c000000000000"}

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
  fs.writeFileSync('../allFiredEvents', JSON.stringify(fakeEvent) + '\n');
  process.exit(0);
});
