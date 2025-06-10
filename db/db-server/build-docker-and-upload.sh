#!/bin/bash
VERSION=`echo "console.log(require('./package.json').version)" | node`
PLATFORMS="linux/amd64,linux/arm64,linux/arm/v7"
#PLATFORMS="linux/amd64"
echo building docker image for version $VERSION
docker buildx use hybrid-builde
docker buildx build --debug \
  --platform $PLATFORMS \
  -t livechange/db-server:$VERSION \
  -t livechange/db-server:latest \
  --push \
  --cache-from=type=registry,ref=livechange/db-server:buildcache \
  --cache-to=type=registry,ref=livechange/db-server:buildcache,mode=max \
  .
  
