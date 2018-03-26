#!/bin/bash

PATH=$PATH:/usr/local/bin

APP_ID=$1
VERSION=$2
if [ -z ${VERSION} ] ; then
    gulp upload --id $APP_ID
else
    gulp upload --id $APP_ID --build $VERSION
fi

echo "Uploading change file for $APP_ID"

cp .mobile-s3 app/.chcplogin
cd ./app
echo "Deploying files for hot code push"
cordova-hcp deploy
cd ..
cp build/versions/.chcplogin app/
