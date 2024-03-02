#!/usr/bin/env bash

POD_NAME=$1
BACKUP_PATH=${2:-../backup.tar.gz}

DIR="$( dirname -- "$( readlink -f -- "$0"; )"; )"
pushd "$DIR/.."

  kubectl cp $BACKUP_PATH $POD_NAME:/app/backup.tar.gz
  kubectl exec -it $POD_NAME -- /app/docker/restore-backup-with-service.sh /app/backup.tar.gz

popd
