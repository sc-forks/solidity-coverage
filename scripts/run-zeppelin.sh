#!/usr/bin/env bash
#
# E2E CI: installs PR candidate on openzeppelin-solidity and runs coverage
#

set -o errexit
echo "Installing --> $CIRCLE_REPOSITORY_URL#$CIRCLE_BRANCH"
set -o errexit