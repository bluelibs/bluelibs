#!/bin/bash

MY_PATH=`dirname "$0"`
MY_PATH=`( cd "$MY_PATH" && pwd )`
PACKAGES_PATH=$MY_PATH/../packages
LIST_STRING=$(cat $MY_PATH/packages-list.txt |tr "\n" " ")
LIST=($LIST_STRING)

for package in ${LIST[@]}; do
  echo "- name: $package"
  echo "  language: node_js"
  echo "  node: 14"
  echo "  cache: npm"
  echo "  env: TARGET=projects/$package"
done

echo "Finished all"
cd $MY_PATH