# How to install 0.7.0

**Install**
```
$ npm install --save-dev solidity-coverage@beta
```

**Add** this package to your plugins array in `truffle-config.js`
```javascript
module.exports = {
  networks: {...},
  plugins: ["solidity-coverage"]
}
```
**Run**
```
truffle run coverage [command-options]
```

A full list of options and other information are [available here][]

# Upgrading from 0.6.x to 0.7.0-beta.x

First, follow [the installation instructions](#how-to-install-070) and see if it works.

:rabbit2: It does!? :/

:elephant: It does not. Good.

#### Are you using Truffle V5?

+ V5 is (currently) required and everything works best with versions >= 5.0.31.

#### Are you launching testrpc-sc yourself as a stand-alone client?

+ Stop launching it. The coverage plugin needs to initialize the client itself so it can hook into the EVM. By default it 
  uses the ganache bundled with your Truffle, but you can use any version (see below). 

#### Were you passing testrpc-sc lots of options as flags?   :jp: :jp: :jp: :jp:

+ If the flags were `allowUnlimitedContractSize`,  `gasLimit`, `gasPrice` or `emitFreeLogs`,
  you can safely ignore them. Ditto if your port was `8555`.

+ If the flags were things like `accounts` or `network_id`, you'll need to transfer them as
  [ganache-core options][1] to a `providerOptions` key in .solcover.js. (There are slight
  variations between these two formats, especially for private key / balance accounts.
  It's best to look carefully at the ganache docs.)

#### Do your tests depend on the specific ganache version you have a local dependency?

+ List it in .solcover.js using the client option
```javascript
client: require('ganache-cli'),
```

#### Do you usually: (1) launch testrpc-sc, (2) do something special, (3) run solidity-coverage? 

+ See [the workflow hooks section][] of the advanced use docs.
  The *something special* will need to be run within an async function declared in .solcover.js

#### Do you have options like copyPackages, deepSkip, testCommand, compileCommand, noRpc...?

+ You can delete these. 

#### Do you still need a 'coverage' network in truffle-config.js?

+ If you're not doing anything unusual there (like assigning a `from` or `network_id` which is only 
  used for coverage) you can safely delete it.

+ You should be able to `truffle run coverage --network <network-name>` and use the same config you
  would for your tests. 
  
+ You can also run without specifying a network and you'll be given default settings which look like
  this:
  ```javascript
  'soliditycoverage': {
    port: 8555,
    host: "127.0.0.1",
    network_id: "*",
  }
  ```
#### It's still not working 

+ Great! We're trying to find and fix as many problems as possible in the beta.

+ If your project is public, please open an issue linking to it and we'll happily 
  open PR into your repo installing it after patching any relevant bugs here.

+ If your project is private, see if you can generate a reproduction case for the 
  problem and we'll try to fix that.
    

[1]: https://github.com/trufflesuite/ganache-core#options
[2]:

