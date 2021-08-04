#!/bin/bash

read -p "Did you create the GitHub repository: bluelibs/$1 ? " -n 1 -r
echo    # (optional) move to a new line
if [[ $REPLY =~ ^[Nn]$ ]]; then
  echo "Ok, come back after you created the repository"
  exit 
fi

CURR_PATH=`( pwd )`
MY_PATH=`dirname "$0"`
MY_PATH=`( cd "$MY_PATH" && pwd )`
TARGET_PATH=$MY_PATH/../packages/$1
cp -r $MY_PATH/../templates/package-template $TARGET_PATH

echo "Copied template in $TARGET_PATH";
cd $TARGET_PATH

git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:bluelibs/$1.git
git push -u origin main

sed -i .old "s/template/$1/g" package.json
rm -f package.json.old
sed -i .old "s/template/$1/g" README.md
rm -f README.md.old
sed -i .old "s/template/$1/g" DOCUMENTATION.md
rm -f DOCUMENTATION.md.old

cd $CURR_PATH
git submodule add https://github.com/bluelibs/$1.git ./packages/$1
echo "Added it as a git submodule"

echo "Done"
echo "Make sure you link it with Travis CI and Coveralls."
echo
echo
cd 