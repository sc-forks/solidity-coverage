#!/usr/bin/env node

const request = require('request')

request({
    uri: 'http://localhost:8888',
    body: {
        jsonrpc: "2.0",
        method: "web3_clientVersion",
        params: [],
        id: 0
    },
    json: true
}, (error, response, body) => {
    if(error) {
        process.exit(1)
    }
    process.exit(0)
})