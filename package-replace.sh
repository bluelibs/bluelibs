#!/bin/bash

PACKAGE="$1"
ROOT="/Users/andy/Desktop/CultOfCoders/bluelibs/packages"

rm -rf node_modules/\@bluelibs/$PACKAGE/dist
rm -rf node_modules/\@bluelibs/$PACKAGE/src

cp -r $ROOT/$PACKAGE/dist "./node_modules/@bluelibs/$PACKAGE/dist"
cp -r $ROOT/$PACKAGE/src "./node_modules/@bluelibs/$PACKAGE/src"

echo "Done copying $PACKAGE"
