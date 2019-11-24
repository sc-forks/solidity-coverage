#!/usr/bin/env bash
#
# E2E CI: installs PR candidate on sc-forks/buidler-e2e (a simple example,
# similar to Metacoin) and runs coverage
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

# Install buidler e2e test
git clone https://github.com/sc-forks/buidler-e2e.git
cd buidler-e2e
npm install

# Install and run solidity-coverage @ PR
npm install --save-dev $PR_PATH
npx buidler coverage
