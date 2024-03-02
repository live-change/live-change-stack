#!/usr/bin/env bash

BACKUP_PATH=${1:-../backup.tar.gz}

DIR="$( dirname -- "$( readlink -f -- "$0"; )"; )"
pushd "$DIR/.."

  /etc/init.d/app stop
  sleep 1
  ./docker/restore-backup.sh $BACKUP_PATH
  sleep 1
  /etc/init.d/app start

popd
