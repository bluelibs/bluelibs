#!/bin/bash

echo "Releasing"

cd ./packages/$1
npm version patch
npm publish

echo "Finished releasing $1"