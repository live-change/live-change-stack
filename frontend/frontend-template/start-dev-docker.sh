#!/bin/bash

docker build -f dev.Dockerfile . -t adone-dev
docker run -it -v $(pwd):/app -p 8001:8001 -p 9001:9001 adone-dev bash
