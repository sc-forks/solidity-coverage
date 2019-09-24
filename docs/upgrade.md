# Upgrading from `0.6.x` to `0.7.0-beta.x`

First, follow [the basic installation instructions]() and see if it works.

-[] It does!? :/

-[] It doesn't. Good.

### Are you using Truffle V5?

+ V5 is (currently) required and everything works best with versions >= 5.0.31.

### Are you launching testrpc-sc as a stand-alone client?

+ Stop. The coverage plugin launches the client itself.

### Were you passing testrpc-sc lots of options as flags?

+ If the flags were --allowUnlimitedContractSize --gasLimit --gasPrice or --emitFreeLogs,
  you can safely ignore them. Ditto if your port was `8555`.

+ If the flags were things like accounts or network_id, you'll need to transfer them as
  [ganache-core options][] to a `providerOptions` key in .solcover.js`. (There are slight
  variations between these two formats, especially for private key / balance accounts.
  It's best to look carefully at the ganache docs.)

### Do your tests depend on the specific ganache version you have a local dependency?

+ List it in `.solcover.js` using the client option
```javascript
client: require('ganache-cli'),
```

### Do you usually launch testrpc-sc, do *something special* and then run coverage?

+ Check out [the workflow hooks section]() of the advanced use docs.
  The *something special* will need to be run within an async function declared in `.solcover.js`

### What about copyPackages and deepSkip and testCommand and compileCommand and....

+ Delete these.

### Do you still need a `coverage` network in `truffle-config.js`?

+ If you're not doing anything special there (like assigning a unique `from` or `network_id`)
  you can safely delete it.

+ You can probably run something like `truffle run coverage --network development` instead and
  use the same configuration defined for your default tests.

