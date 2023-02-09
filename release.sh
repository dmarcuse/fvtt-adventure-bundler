#!/usr/bin/env bash

set -e

yarn build
pushd module
if [[ -e module.zip ]]; then
    rm module.zip
fi
zip -r module.zip *
