# Changelog

0.2.1 / 2017-07-29
=================

  * Verify testrpc-sc's location in node_modules before invoking (yarn / package-lock.json fix)
  * Fix lcov html report bug introduced in 0.1.9

0.2.0 / 2017-07-26
=================

  * Stop ignoring package-lock.json - npm version wants it
  * Add testrpc-sc publication docs
  * Update to use testrpc-sc v 4.0.1 (tracking testrpc 4.0.1)

0.1.10 / 2017-07-25
==================

  * Cover assert/require statements as if they were if statements (which, secretly, they are)
  * Add documentation justifying the above changes
  * Upgraded solc to 0.4.13 
  * Switch to using ethereumjs-vm-sc in order to be able to test case where asserts and requires fail

0.1.9 / 2017-07-23
==================

  * Pin testrpc-sc to its 3.0.3 branch as a safe-haven while we upgrade to testrpc v4
  * Add changelog
  * Simplify and reorder README, add CI integration guide
  * Add testrpc-sc signing test and lint
  * Clear cache on CI, add Maurelian to contributor list
  * exec.js refactor: modularized and moved logic to lib/app.js
  * More informative TestRPC failure logging

0.1.8 / 2017-07-13
==================

  * Add Alan Lu as contributor
    Also remove mysterious crash known issue, since he fixed it.
  * Fix testrpc-sc race condition
  * Test command runs after TestRPC starts listening
  * Improved mock test command
  * Added test for race condition
  * README updates: remove require info, add memory info
  * Add Invalid JSON RPC note to known issues in README

0.1.7 / 2017-07-05
==================

  * Instrument empty contract bodies correctly
  * Instrument conditional assignment to MemberExpressions

0.1.6 / 2017-07-03
==================

  * Add gas estimation example. Pin truffle to 3.2.5
  * Allow files to be skipped during coverage
    While ordinarily we shouldn't want to do these, it is possible to
    construct valid contracts using assembly that break when the coverage
    events are injected.

0.1.5 / 2017-06-26
==================

  * Fix istanbul exiting error 
  * Fix tuple parsing / update tests

0.1.4 / 2017-06-26
==================

  * Change testrpc path for yarn compatibility
  * Small exec.js cleanup, clarify port options settings in README
  * Unit test copying project into env 
  * Copy all directories when setting up coverageEnv
    The exception is `node_modules`, which must have copyNodeModules
    set to `true` in .solcover.js in order to be included.

0.1.3 / 2017-06-21
==================

  * Stop crashing on encounters with non-truffle projects

0.1.2 / 2017-06-21
==================

  * Add repository field to package, use cache again on CI

0.1.1 / 2017-06-20
==================

  * Remove events warning, update package webpage, misc rewordings
  * Fix testrpc filter tests. Disable yarn
  * Add (disabled) events filter unit test
  * Add truffle as dev dep, re-yarn
  * Add topic logging to coverageMap
  * Add yarn.lock, use yarn on CI
  * Use coverage network port if avail (& unit test).
  * Edits to HDWalletProvider notes
  * Add npm version badge, update known issues
  * Pin SP to sc-forks#master (has post-install script to build parser)
  * Remove parse.js dummy node list, order nodes alphabetically
    Note: This change exposes the fact that a number of cases aren't actually being checked in the 
    parse table. Possible test-deficits / parse-table logic defects here.
  * Remove parse.js dummy node list, order nodes alphabetically
  * add waffle.io badge

0.1.0 / 2017-05-13
==================

  * Change install instructions, small edits & formatting

0.0.1 / 2017-05-13
==================

  * Move files into /lib and /bin
  * Use node_modules/.bin/testrpc-sc
  * Disambiguate package name & fix readme option params
  * Edit readme to reflect repo name, add options, contributors, contrib guidelines
  * Update to Truffle3, refactor CLI, add CLI unit tests, fix misc bugs
  * Disable two "config" tests for CI - multiple testrpc launches max out container memory limit
  * Rename "run" folders/files "cli" for consistency
  * Fix broken chained call handling, add unit tests to verify cases get coverage
  * Add unit test for arbitrary testing command config option, remove test flush
  * Allow testrpc options string in config, rename run to cli (test sequencing fix)
  * Update README with known issues, links to zeppelin example report
