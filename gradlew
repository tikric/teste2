#!/usr/bin/env sh

# Define the directory of this script
DIR=$(cd "$(dirname "$0")" && pwd)

# Search for system gradle if wrapper is missing
if [ -f "$DIR/gradle/wrapper/gradle-wrapper.jar" ]; then
    exec java -jar "$DIR/gradle/wrapper/gradle-wrapper.jar" "$@"
else
    exec gradle "$@"
fi
