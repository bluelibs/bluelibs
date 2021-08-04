#!/bin/bash

MY_PATH=`dirname "$0"`
MY_PATH=`( cd "$MY_PATH" && pwd )`
PACKAGES_PATH=$MY_PATH/../packages
LIST_STRING=$(cat $MY_PATH/packages-list.txt |tr "\n" " ")
LIST=($LIST_STRING)

for package in ${LIST[@]}; do
  cd $PACKAGES_PATH/$package
  rm -rf node_modules;
  rm -f package-lock.json;
  lerna link;
  npm install

  echo "Completed command for $package";
done

echo "Finished"
cd $MY_PATH
