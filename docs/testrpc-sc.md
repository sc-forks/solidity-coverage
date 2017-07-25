# How to upgrade testrpc-sc

Warning: this is a birds nest. Any ideas for improvement, however small, are welcome. 

### testrpc-sc:
+ published on `npm` as `ethereumjs-testrpc-sc`
+ published **from the coverage branch** of [`sc-forks/testrpc-sc`](https://github.com/sc-forks/testrpc-sc/tree/coverage)
+ a webpack bundle of `sc-forks/ganache-core-sc#coverage` and all of its dependencies.
+ changing `sc-forks/ganache-core#coverage` or any of its dependencies cannot harm `testrpc-sc` (until publication)
+ publishing `testrpc-sc` cannot harm `solidity-coverage` until its deps are updated.

To publish a new version:

```
$ git checkout coverage
$ rm -rf node_modules
$ yarn install
$ npm run build       // Check build, just to make sure
$ npm version patch   // If helpful. If you're tracking the upstream with a ganache-core sync, use theirs.
$ git push
$ npm publish         // This also runs build.  

// Go to `solidity-coverage` and pin its `testrpc-sc` dependency to the new version. 
```
### sc-forks/ganache-core-sc:
+ is what testrpc-sc used to be
+ set by default to [its `coverage` branch](https://github.com/sc-forks/ganache-core-sc)
+ depends on `sc-forks/ethereumjs-vm-sc.git`
+ depends on `sc-forks/provider-engine-sc.git#8.1.19` 
+ differs from `truffle-suite/ganache-core` by these deps AND 
  [two lines](https://github.com/sc-forks/ganache-core/blob/ae31080cdc581fef416a1c68cbe28ff71b6fb7c9/lib/blockchain_double.js#L36-L37) 
  in `blockchain_double.js` which set the block and transaction default gas limits.

To sync `ganache-core-sc` with its upstream parent at `truffle-suite`
```
$ git checkout master
$ git remote add upstream https://github.com/trufflesuite/ganache-core.git
$ git pull upstream master
$ git push
$ git checkout coverage 
$ git rebase -i master (there will probably be conflicts)
$ git push
```

### How can I modify ethereumjs-vm-sc and test the changes at `solidity-coverage`?

Cut a channel of branches (say `#vm`) through the entire project:

`solidity-coverage#vm` with `package.json`
```
"ethereumjs-testrpc-sc": "https://github.com/sc-forks/testrpc-sc.git#vm"
```

`testrpc-sc#vm` **based on the coverage branch** with `package.json`
```
"ganache-core": "https://github.com/sc-forks/ganache-core-sc.git#vm"
```

`ganache-core#vm` with `package.json`
```
"ethereumjs-vm": "https://github.com/sc-forks/ethereumjs-vm-sc.git#vm"
```

`ethereumjs-vm-sc#vm` (This is where you will work).

+ To test your changes: 
  + freshly install `node_modules` in testrpc-sc#vm and execute `npm run build` 
  + freshly install `node_modules` in `solidity-coverage#vm`


+ To merge / publish the changes:
  + Merge `ethereumjs-vm-sc#vm` to master.
  + follow the `testrpc-sc` publication steps above.










