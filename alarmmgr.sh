#!/bin/sh
#

set -xe

npm run start ${@:+-- $@}
