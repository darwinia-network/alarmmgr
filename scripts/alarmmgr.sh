#!/bin/sh
#
set -xe
BIN_PATH=$(cd "$(dirname "$0")"; pwd -P)
WORK_PATH=${BIN_PATH}/../

cargo build --manifest-path ${WORK_PATH}/Cargo.toml

${WORK_PATH}/target/debug/alarmmgr $@


