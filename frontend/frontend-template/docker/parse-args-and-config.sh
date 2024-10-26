REPO=docker.chaosu.pl

VERSION=`echo "console.log(require('./package.json').version)" | node`
NAME=`echo "console.log(require('./package.json').name.split('/').pop())" | node`

BRANCH=$(git symbolic-ref --short HEAD)
DEPLOYMENT=${1:-$BRANCH}
echo "DEPLOYMENT=${DEPLOYMENT}"

#BASE_HREF="https://$DEPLOYMENT.example.com/"

#if [ "$DEPLOYMENT" == "master" ]; then
  BASE_HREF='https://www.example.com/'
#fi

PROJECT_NAME=${NAME}

if [ "$DEPLOYMENT" == "master" ]; then
  echo ok
fi
