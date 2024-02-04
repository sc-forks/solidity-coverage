#!/usr/bin/env bash

SILENT=true node --max-old-space-size=4096 \
  ./node_modules/.bin/nyc \
    --reporter=lcov \
    --exclude '**/sc_temp/**' \
    --exclude '**/test/**/' \
    --exclude 'plugins/resources/matrix.js' \
  -- \
  mocha \
    test/units/* test/integration/* \
    --require "test/util/mochaRootHook.js" \
    --timeout 100000 \
    --no-warnings \
    --exit \
