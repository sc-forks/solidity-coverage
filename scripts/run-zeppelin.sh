#!/usr/bin/env bash
#
# E2E CI: installs PR candidate on openzeppelin-solidity and runs coverage
#

set -o errexit
# Get path to PR branch
PR_PATH=$(echo "$URL#$BRANCH" | sed 's/git@github.com:/https:\/\/github.com\//')
echo "Installing $PR_PATH"

sudo git clone https://github.com/OpenZeppelin/openzeppelin-solidity.git
cd openzeppelin-solidity || exit

# EDITS
# Use testrpc-sc ...
# sed -i 's/ganache-cli-coverage/testrpc-sc/g' scripts/test.sh
# sed -i 's/--emitFreeLogs true/ /g' scripts/test.sh

# Do not ping coveralls
sed -i 's/cat coverage\/lcov.info | npx coveralls/echo "No coveralls"/g' scripts/test.sh

# Doesn't install inside docker (thanks Circle!)
echo "Uninstalling solidity-docgen"
sudo npm uninstall --save-dev solidity-docgen

# Swap installed coverage for PR branch version
echo "Running: npm install"
sudo npm install

echo "Running npm uninstall solidity-coverage"
sudo npm uninstall --save-dev solidity-coverage

echo "Running npm install PR_PATH"
sudo npm install --save-dev "$PR_PATH"

sudo npm run coverage

# Trick to 'allowFailure' on CIRCLE
set -o errexit