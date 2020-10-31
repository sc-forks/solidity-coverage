#!/usr/bin/env bash
#
# E2E CI: installs PR candidate on openzeppelin-contracts and runs coverage
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

npm install -g yarn;

# Install Zeppelin
git clone https://github.com/OpenZeppelin/openzeppelin-contracts.git
cd openzeppelin-contracts

# Swap installed coverage for PR branch version
echo ">>>>> yarn install"
yarn install

echo ">>>>> yarn remove solidity-coverage --dev"
yarn remove solidity-coverage --dev

echo ">>>>> yarn add $PR_PATH --dev"
yarn add "$PR_PATH" --dev

# Track perf
time npx buidler coverage
