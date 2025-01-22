#!/usr/bin/env bash

DIR="$( dirname -- "$( readlink -f -- "$0"; )"; )"
pushd "$DIR/.."

  source ./docker/parse-args-and-config.sh

  POD_NAME="${POD_NAME="$DEPLOYMENT-$NAME"}"
  echo POD_NAME=$POD_NAME

  echo Compiling

  npm run build

  echo Uploading

  rsync -av --progress --stats --delete -e 'docker/k8s-rsync-helper.sh' \
     front server package.json package-lock.json \
     $POD_NAME:/app

  echo Updating deps
  kubectl exec $POD_NAME -- yarn install

  echo Restarting

  kubectl exec $POD_NAME -- /etc/init.d/app restart

  echo Done

popd
