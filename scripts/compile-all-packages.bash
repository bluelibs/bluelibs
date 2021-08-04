#!/bin/bash

MY_PATH=`dirname "$0"`
MY_PATH=`( cd "$MY_PATH" && pwd )`
PACKAGES_PATH=$MY_PATH/../packages
LIST_STRING=$(cat $MY_PATH/packages-list.txt |tr "\n" " ")
LIST=($LIST_STRING)

for package in ${LIST[@]}; do
  cd $PACKAGES_PATH/$package
  npm run compile
  echo "Completed command for $package";
done

echo "Finished"
cd $MY_PATH