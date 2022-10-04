#!/bin/bash

currentBranch=`git rev-parse --abbrev-ref HEAD`
targetBranch='master'

if [ $currentBranch == $targetBranch ]
then
  echo 'error: master cannot push'
  exit 1
fi

exit 0