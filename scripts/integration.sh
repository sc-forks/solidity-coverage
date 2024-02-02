#!/usr/bin/env bash

SILENT=true node --max-old-space-size=4096 \
  ./node_modules/.bin/nyc \
    --exclude '**/sc_temp/**' \
    --exclude '**/test/**/' \
  -- \
  mocha test/integration/* \
    --timeout 100000 \
    --no-warnings \
    --exit
