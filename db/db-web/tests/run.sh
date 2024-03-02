#!/bin/bash

browserify tests/index.js --debug | tape-run --browser chrome # --keep-open
browserify tests/query-observable.js --debug | tape-run --browser chrome # --keep-open
browserify tests/query-get.js --debug | tape-run --browser chrome # --keep-open
browserify tests/table.js --debug | tape-run --browser chrome # --keep-open
browserify tests/log.js --debug | tape-run --browser chrome # --keep-open
