# How to upgrade testrpc-sc

Warning: this is a birds nest. Any ideas for improvement, however small, are welcome.

### testrpc-sc:
+ published on `npm` as `ethereumjs-testrpc-sc`
+ published **from the coverage branch** of [`sc-forks/testrpc-sc`](https://github.com/sc-forks/testrpc-sc/tree/coverage)
+ a webpack bundle of `sc-forks/ganache-core-sc#coverage` and all of its dependencies.
+ changes to `sc-forks/ganache-core` do not propagate until `testrpc-sc` is rebuilt and published
+ publishing `testrpc-sc` does not propagate until `solidity-coverage`s deps are updated.

To publish a new version:

```
$ git checkout develop
$ git pull upstream develop
$ git checkout coverage
$ git rebase develop

> Update your ganache-core hash
> NOTE TO CGEWECKE: MAKE SURE YOU RENAMED THE PACKAGE (and the .bin command)!!!!
> OTHERWISE YOU WILL PUBLISH OVER THE REAL GANACHE-CLI
>

$ rm -rf node_modules
$ yarn install        // This step seems to be absolutely necessary.
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
+ differs from `truffle-suite/ganache-core` by these deps and
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

Since `solidity-coverage@0.1.10`, ethereumjs-vm-sc is an independent dev dependency,
required by the coverage unit tests. The new testrpc has a separate webpacked copy. The simplest
thing to do is open a branch at `solidity-coverage` and develop directly on the `vm` dep.
When you're satisfied that tests pass with your changes, copy your work over to the `ethereumjs-vm-sc` repo itself.

In `test/util/vm.js` the `results` object passed back by `vm.runTx` at [callMethod](https://github.com/sc-forks/solidity-coverage/blob/master/test/util/vm.js#L120)
also contains things like the runState and the logs: ex: `results.vm.runState.logs`.

+ To merge / publish the changes:
  + Merge `ethereumjs-vm-sc#my-new-vm` to master.
  + follow the `testrpc-sc` publication steps above.

There's no reason to worry about changing ethereumjs-vm-sc at master. If that affects anyone (unlikely)
they have safe harbour at any solidity-coverage installation @0.1.9 and up. They can update.

### E2E Testing

[sc-forks/zeppelin-solidity](https://github.com/sc-forks/zeppelin-solidity) has been configured to
serve as a simple pre-publication E2E test. By default the package pulls solidity-coverage from the repo's master branch.
You can trigger a [CI build](https://travis-ci.org/sc-forks/zeppelin-solidity) and [Coveralls report](https://coveralls.io/github/sc-forks/zeppelin-solidity) by running:

```
$ npm run ci
```

### solidity-parser-sc

We also publish `solidity-parser-sc` because `consensys/solidity-parser` in its .pegjs form has been
left to die in the wild, unloved by all. Publish at the publish branch by running `npm version patch`, `npm publish`.







