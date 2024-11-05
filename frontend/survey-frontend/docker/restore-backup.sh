#!/usr/bin/env bash

BACKUP_PATH=${1:-../backup.tar.gz}
DB_NAME=${DB_NAME:-laszczewski-pl}

DIR="$( dirname -- "$( readlink -f -- "$0"; )"; )"
pushd "$DIR/.."

  rm -rf backup
  mkdir -p backup
  pushd backup
    tar -zxf $BACKUP_PATH
    ../node_modules/.bin/lcdbc --serverUrl $DB_URL --verbose request database.deleteDatabase $DB_NAME
    echo uploading data to database...
    ../node_modules/.bin/lcdbc --serverUrl $DB_URL --verbose exec --targetDb $DB_NAME db.json
    echo data uploaded
    rm -rf ../storage/*
    mv storage/* ../storage
    echo backup restored
  popd

popd
