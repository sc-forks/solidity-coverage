#!/usr/bin/env bash
#
# E2E CI: installs PR candidate on openzeppelin-solidity and runs coverage
#

set -o errexit

# Get rid of any caches
sudo rm -rf node_modules
echo "NVM CURRENT >>>>>" && nvm current

# Use PR env variables (for forks) or fallback on local if PR not available
SED_REGEX="s/git@github.com:/https:\/\/github.com\//"

if [[ -v CIRCLE_PR_REPONAME ]]; then
  PR_PATH="https://github.com/$CIRCLE_PR_USERNAME/$CIRCLE_PR_REPONAME#$CIRCLE_SHA1"
else
  PR_PATH=$(echo "$CIRCLE_REPOSITORY_URL#$CIRCLE_SHA1" | sudo sed "$SED_REGEX")
fi

echo "PR_PATH >>>>> $PR_PATH"

# Install sc-forks Zeppelin fork (temporarily). It's setup to
# consume the plugin and skips a small set of GSN tests that rely on
# the client being stand-alone. (See OZ issue #1918 for discussion)
git clone https://github.com/sc-forks/openzeppelin-solidity.git#provider-benchmarks
cd openzeppelin-solidity

# Swap installed coverage for PR branch version
echo ">>>>> npm install"
npm install

echo ">>>>> npm uninstall --save-dev solidity-coverage"
npm uninstall --save-dev solidity-coverage

echo ">>>>> npm install --save-dev PR_PATH"
npm install --save-dev "$PR_PATH"

# Track perf
time npx truffle run coverage
