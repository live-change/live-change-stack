#!/bin/bash
VERSION=`echo "console.log(require('./package.json').version)" | node`
echo building docker image for version $VERSION
docker build -t livechange/db-server-aarch64:$VERSION -t livechange/db-server-aarch64:latest .
echo uploading docker image to docker hub
docker push livechange/db-server-aarch64:$VERSION
docker push livechange/db-server-aarch64:latest

