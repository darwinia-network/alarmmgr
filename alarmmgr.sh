#!/bin/sh
#


set -xe

BIN_PATH=$(cd "$(dirname "$0")"; pwd -P)

cd ${BIN_PATH}/packages/bin/

npm run start ${@:+-- $@}
