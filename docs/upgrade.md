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

A full list of options and other information are [available here][8]

# Upgrading from 0.6.x to 0.7.0-beta.x

First, follow [the installation instructions](#how-to-install-070) and see if it works.

:rabbit2: It does!? Bye.

:elephant: It does not. Good...

#### Are you using Truffle V5?

+ Everything works best with Truffle versions >= 5.0.31.

#### Are you launching testrpc-sc yourself as a stand-alone client?

+ Stop launching it. The coverage plugin needs to initialize the client itself so it can hook into the EVM.

+ By default it uses the ganache bundled with Truffle, but you can use any version (see below).

#### Were you passing testrpc-sc lots of options as flags?   :jp: :jp: :jp: :jp: :jp:

+ If the flags were `allowUnlimitedContractSize`,  `gasLimit`, `gasPrice` or `emitFreeLogs`,
  you can safely ignore them. Ditto if your port was `8555`.

+ If the flags were things like `accounts` or `network_id`, you'll need to transfer them as
  [ganache-core options][1] to the `providerOptions` key in .solcover.js.

+ Ganache's "cli flag" and "js option" formats are slightly different. Check out [their docs][1]

  **Example**

  *Before (at the command line)*
  ```
  $ testrpc-sc --account="0x2b...7cd,1000000000000000000000000" -i 1999 --noVmErrorsOnRPCResponse
  ```

  *Now (in .solcover.js)*
  ```javascript
  providerOptions: {
    accounts: [{
      secretKey: "0x2b.............7cd",
      balance: "0xD3C21BCECCEDA1000000"   // <-- Must be hex
    }],
    network_id: 1999,
    vmErrorsOnRPCResponse: false
  }

#### Do you have a 'coverage' network in truffle-config.js?

+ If you copy-pasted it from the <= 0.6.x docs, **you can safely delete it**.

+ You should be able to `truffle run coverage --network <network-name>` and use the same config you
  run your regular tests with.

+ You can also omit the network flag and you'll be given default settings which look like this:
  ```javascript
  'soliditycoverage': {
    port: 8555,
    host: "127.0.0.1",
    network_id: "*",
  }
  ```
#### Do your tests depend on the specific ganache version you have as a local dependency?

+ Declare it in .solcover.js using the client option
  ```javascript
  client: require('ganache-cli'),
  ```

#### Does your config contain any deprecated options?
+ They are:
  ```
  accounts,       # Now: `providerOptions: { total_accounts: <number> }`
  buildDirPath,   # Now: `--temp <path>` (At the command line, see Advanced Use)
  copyPackages,
  copyNodeModules,
  deepSkip,
  testCommand,
  compileCommand,
  noRpc
  ```

+ You can delete them.

#### Do you usually: (1) launch testrpc-sc, (2) do something special, (3) run solidity-coverage?

+ See [the workflow hooks documentation][3]. The "something special" will likely need to run within
  an async function declared in .solcover.js

#### Are you what some might call an 'advanced user'?

+ See [Advanced Use][2]

#### Would you like to see some real-world installation examples?

+ [metacoin][4]
+ [openzeppelin-contracts][5]
+ [joinColony/colonyNetwork][6]
+ [aragon/aragon-court][7]

#### :tada:  It's still not working!! :tada:

+ If your project is public, please open an issue linking to it and we will advise and/or
  open a PR into your repo installing solidity-coverage after patching any relevant bugs here.

+ If your project is private, see if you can generate a reproduction case for the
  problem and we'll try to fix that.


[1]: https://github.com/trufflesuite/ganache-core#options
[2]: https://github.com/sc-forks/solidity-coverage/blob/beta/docs/advanced.md
[3]: https://github.com/sc-forks/solidity-coverage/blob/beta/docs/advanced.md#workflow-hooks
[4]: https://github.com/sc-forks/metacoin
[5]: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/1923
[6]: https://github.com/JoinColony/colonyNetwork/pull/716
[7]: https://github.com/aragon/aragon-court/pull/123
[8]: https://github.com/sc-forks/solidity-coverage/tree/beta#command-options

