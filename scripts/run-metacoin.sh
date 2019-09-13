#!/usr/bin/env bash
#
# E2E CI: installs PR candidate on Truffle's MetaCoin and runs coverage
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

# Install truffle and metacoin box
npm install -g truffle
mkdir metacoin
cd metacoin
truffle unbox metacoin --force
rm truffle-config.js
echo "module.exports={plugins:['solidity-coverage']}" > truffle-config.js
cat truffle-config.js

# TODO: Remove this rm.
# Unknown bug running truffle native solidity tests
rm test/TestMetaCoin.sol

# Install and run solidity-coverage @ PR
npm init --yes
npm install --save-dev $PR_PATH
npx truffle run coverage
