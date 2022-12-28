#!/bin/bash

for d in */ ; do
    pushd $d
        echo publishing one more time $d
        npm publish --access public
    popd
done
