#!/usr/bin/env bash

DIR="$( dirname -- "$( readlink -f -- "$0"; )"; )"
pushd "$DIR/.."

  source ./docker/parse-args-and-config.sh

  set +ex

  git commit -a
  npm version patch
  git push
  ./docker/build-docker-and-upload.sh $DEPLOYMENT

  set -e

popd
