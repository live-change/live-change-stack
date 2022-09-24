#!/bin/bash
VERSION=`echo "console.log(require('./package.json').version)" | node`
PLATFORMS="linux/amd64,linux/arm64,linux/arm/v7"
echo building docker image for version $VERSION
docker buildx build --platform $PLATFORMS -t livechange/db-server:$VERSION -t livechange/db-server:latest --push .

