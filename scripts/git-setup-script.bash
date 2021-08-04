#!/bin/bash

git init
git remote add origin git@github.com:bluelibs/$1.git
git add .
git commit -m "Initial commit"
git push -u origin master