#!/usr/bin/env bash
#
# E2E CI: installs PR candidate on openzeppelin-solidity and runs coverage
#

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

# Install Zeppelin
git clone https://github.com/OpenZeppelin/openzeppelin-solidity.git
cd openzeppelin-solidity

# Update Zeppelin's script to use 0.6.x
sed -i 's/if/# /g' scripts/coverage.sh
sed -i 's/curl/# /g' scripts/coverage.sh
sed -i 's/fi/# /g' scripts/coverage.sh
sed -i 's/ganache-cli-coverage/testrpc-sc/g' scripts/test.sh
sed -i 's/--emitFreeLogs true/ /g' scripts/test.sh

# Swap installed coverage for PR branch version
echo ">>>>> npm install"
npm install

echo ">>>>> npm uninstall --save-dev solidity-coverage"
npm uninstall --save-dev solidity-coverage

echo ">>>>> npm install --save-dev PR_PATH"
npm install --save-dev "$PR_PATH"

npm run coverage
