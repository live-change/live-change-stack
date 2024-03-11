#!/bin/bash

for d in */*/ ; do
    pushd $d
        echo updating live change in $d
        ncu '/^@live-change/.*$/' -u
    popd
done
