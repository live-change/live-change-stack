#!/usr/bin/env bash
set -e

DIR="$( dirname -- "$( readlink -f -- "$0"; )"; )"

pushd "$DIR/.."

  source ./docker/parse-args-and-config.sh

  echo "Building \"${BRAND_NAME}\" (${BRAND_DOMAIN}) ${NAME}:${VERSION}-${DEPLOYMENT}"

  set -ex

  ./docker/onlyDependencies.js > package-deps.json

  docker build \
    -t ${NAME}:${VERSION}-${DEPLOYMENT}\
    -t ${NAME}:${DEPLOYMENT}\
    -t ${REPO}/${NAME}:${VERSION}-${DEPLOYMENT}\
    -t ${REPO}/${NAME}:${DEPLOYMENT}\
    --secret id=npmrc,src=$HOME/.npmrc\
    --build-arg VERSION=${VERSION}-${DEPLOYMENT}\
    --build-arg BASE_HREF=${BASE_HREF}\
    --build-arg GOOGLE_CLIENT_ID="${GOOGLE_CLIENT_ID}"\
    --build-arg LINKEDIN_CLIENT_ID="${LINKEDIN_CLIENT_ID}"\
    --build-arg BRAND_NAME="${BRAND_NAME}"\
    --build-arg BRAND_DOMAIN="${BRAND_DOMAIN}"\
    --build-arg BRAND_SMS_FROM="${BRAND_SMS_FROM}"\
    --build-arg PROJECT_NAME="${PROJECT_NAME}"\
    .

  docker push ${REPO}/${NAME}:${VERSION}-${DEPLOYMENT}
  docker push ${REPO}/${NAME}:${DEPLOYMENT}

  set +x

  echo "Done building ${NAME}:${VERSION}-${DEPLOYMENT}"

popd
