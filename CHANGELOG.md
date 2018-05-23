# Changelog
0.5.4 / 2018-05-23
==================
  * Use require.resolve() to get the path of testrpc-sc (lerna + yarn workspaces compatibility) (contribution @vdrg)
 
0.5.3 / 2018-05-22
=================
  * Add -L flag when copying packages specified in the copyPackages option (following symlinks | lerna + yarn workspaces compatibility) (contribution
    @vdrg)

0.5.2 / 2018-05-20
==================
  * Silence security warnings coming from the parser by upgrading mocha there to v4.
  * Kill testrpc w/ tree-kill so that the childprocess actually dies in linux.

0.5.0 / 2018-04-20
==================
  * Update README for 0.5.0
  * Cleanup stdout/stderr streams on exit. This might stop testrpc-sc from running as a background
    zombie on Linux systems, post-exit.
  * Support `constructor` keyword
  * Prefix instrumentation events with `emit` keyword
  * (Temporarily) remove support for ternary conditional branch coverage. Solidity no longer allows
    us to emit instrumentationevents within the grammatical construction @area devised to
    make this possible.

0.4.15 / 2018-03-28
===================
  * Update parser to allow `emit` keyword (contribution @andresilva).

0.4.14 / 2018-03-15
====================
* Fix misc bugs related to testrpc-sc using an older version of `ganache-cli` to webpack testrpc-sc
  by bumping to testrpc-sc 6.1.2

0.4.13 / 2018-03-15
====================
  * Fix bug introduced in 0.4.12 that broke internal rpc server launch. (contribution @andresilva)

0.4.12 / 2018-03-13
===================
  * Fix bug that caused parser to crash on JS future-reserved keywords like `class`
  * Use newer more stable `ganache-core` as core of testrpc-sc.
  * Update instrumentation to allow interface contracts.

0.4.11 / 2018-03-04
===================
  * Add @vdrg to contributor list
  * Update parser to allow function types as function parameters (contribution: vrdg)

0.4.10 / 2018-02-24
===================
  * Fix bug that corrupted the line coverage alignment in reports when view/pure modifiers
    occupied their own line.

0.4.9 / 2018-01-23
==================
  * Fix bug that ommitted line-coverage for lines with trailing '//' comment

0.4.8 / 2018-01-02
==================

  * Fix windows html report bug caused by failure to pass path relativized mapping to Istanbul

0.4.5 - 0.4.7 / 2017-12-21
==================

  * Fix parsing bug preventing fn definition in structs. Bump parser to 0.4.4

0.4.4 / 2017-12-19
==================
  * Fix build folder management by only deleting its contracts folder (contribution: ukstv)
  * Document problems/solutions when Truffle must be a local dependency.

0.4.3 / 2017-12-08
==================

  * Stop requiring that `view` `pure` and `constant` methods be invoked by `.call` (solution: spalladino @ zeppelin)
  * Add ability to include specific node_modules packages (contribution: e11io), dramatically speeding
    up coverage env generation for larger projects.
  * Add ability to skip instrumentation for an entire folder.

0.4.2 / 2017-11-20
==================

  * Bug fix to gracefully handle *.sol files that are invalid Solidity during pre-processing.

0.4.1 / 2017-11-19
==================

  * Bug fix to allow `constant` keyword for variables by only removing visibility modifiers from
    functions. Uses the preprocessor walking over the AST rather than a regex

0.4.0 / 2017-11-08 (Compatible with testrpc >= 6.0 / pragma 0.4.18 and above)
==================

  * Bug fix to accomodate strict enforcement of constant and view modifiers in pragma 0.4.18

0.3.5 / 2017-11-07 (Compatible with testrpc >= 6.0 / pragma 0.4.17 and below)
==================

  * Bug fix to accomodate Truffle's simplified interface for view and constant
  * Bug fix to accomodate enforcement of EIP 170 (max contract bytes === 24576)

0.3.0 / 2017-11-05
===================

  * Add sanity checks for contracts and coverageEnv folders
  * Update testrpc-sc to 6.0.3 (Byzantium fork)

0.2.7 / 2017-10-12
=================
  * Fix bug that prevented overloading abstract pure methods imported from outside the
    contracts directory (@elenadimitrova)
  * Begin using npm published solidity-parser-sc / allow upgrading with yarn (@elenadimitrova)
  * Update README and FAQ for Windows users

0.2.6 / 2017-10-11
=================
  * Permit view and pure modifiers
  * Permit experimental pragma
  * Upgrade development deps to truffle4 beta and solc 0.4.17
  * Fix bug causing large suites that use the internal testrpc launch to crash mysteriously
    by increasing testrpc-sc stdout buffer size. (@rudolfix / Neufund contribution)
  * Fix bugs that made tool (completely) unrunnable and report unreadable on Windows. (@phiferd contribution)
  * Fix bug that caused tool to crash when reading the events log from very large test suites by
    reading the log line by line as a stream. (@rudolfix / Neufund contribution)

0.2.5 / 2017-10-02
=================
  * Revert vm stipend fix, it was corrupting balances. `send` & `transfer` to instrumented fallback
    will fail now though.

0.2.4 / 2017-09-22
=================

  * Fix bug where sigint handler wasn't declared early enough in the exec script, resulting
    in occasional failure to cleanup.

0.2.3 / 2017-09-13
=================

  * Add unit tests for transfers and sends to instrumented fallback fns.
  * Fix bug in testrpc-sc causing transfers/sends to fail with instrumented fallback fns.

0.2.2 / 2017-08-21
=================

  * Allow truffle.js to be named truffle-config.js for windows compatibility
  * Remove old logic that handled empty function body instrumentation (lastchar special case)
  * Correctly instrument comments near function's {

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
