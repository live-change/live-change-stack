#!/bin/bash
VERSION=`echo "console.log(require('./package.json').version)" | node`
PLATFORMS="linux/amd64,linux/arm64,linux/arm/v7"
export BUILDKIT_PROGRESS=plain
export DOCKER_BUILDKIT=1 
#PLATFORMS="linux/amd64"
echo building docker image for version $VERSION
docker buildx use hybrid-builder
docker buildx build --debug \
  --builder hybrid-builder \
  --build-arg VERSION=$VERSION \
  --platform $PLATFORMS \
  -t livechange/db-server:$VERSION \
  -t livechange/db-server:latest \
  --push \
  --cache-from=type=registry,ref=livechange/db-server:buildcache \
  --cache-to=type=registry,ref=livechange/db-server:buildcache,mode=max \
  .
  
