#!/usr/bin/env bash
#
# E2E CI: installs PR candidate on sc-forks/buidler-e2e (a simple example,
# similar to Metacoin) and runs coverage
#

set -o errexit

function verifyCoverageExists {
  if [ ! -d "coverage" ]; then
    echo "ERROR: no coverage folder was created."
    exit 1
  fi
}

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

echo ""
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo "Simple buidler/buidler-trufflev5    "
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo ""

# Install buidler-e2e
git clone https://github.com/sc-forks/buidler-e2e.git
cd buidler-e2e
npm install --silent

# Install and run solidity-coverage @ PR
npm install --save-dev --silent $PR_PATH
cat package.json

npx buidler coverage

verifyCoverageExists

echo ""
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo "Simple hardhat/hardhat-trufflev5    "
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo ""

# Install hardhat-e2e (HardhatEVM)
git clone https://github.com/sc-forks/hardhat-e2e.git
cd hardhat-e2e
npm install --silent

# Install and run solidity-coverage @ PR
npm install --save-dev --silent $PR_PATH
cat package.json

npx hardhat coverage

verifyCoverageExists

# Install buidler-ethers
echo ""
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo "Simple buidler/buidler-ethers       "
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo ""
cd ..
git clone https://github.com/sc-forks/example-buidler-ethers.git
cd example-buidler-ethers
npm install --silent

# Install and run solidity-coverage @ PR
npm install --save-dev --silent $PR_PATH
cat package.json

npx buidler coverage

verifyCoverageExists

echo ""
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo "Complex: MolochDao/moloch           "
echo ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
echo ""

# Install sc-forks/moloch
cd ..
git clone https://github.com/sc-forks/moloch.git
cd moloch
npm install --silent
npm uninstall --save-dev --silent solidity-coverage

# Install and run solidity-coverage @ PR
# Should run on network 'localhost'
npm install --save-dev --silent $PR_PATH
npm run coverage

verifyCoverageExists

