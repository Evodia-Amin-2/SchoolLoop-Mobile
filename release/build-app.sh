#!/bin/bash
PATH=$PATH:/usr/local/bin:~/Library/Android/sdk/platform-tools:~/Library/Android/sdk/tools
export ANDROID_HOME=~/Library/Android/sdk

if [[ $# -eq 0 ]] ; then
    echo '    usage:  build {id} {appName} {version} {build}'
    echo '  example:  build "app"  "School Loop" "2.0.0" "1999" "beta"'
    exit 1
fi

ID=$1
NAME=$2
VERSION=$3
BUILD=$4
FILENAME="$(echo -e "${NAME}" | tr -d '[[:space:]]')"

if [ ! -d "node_modules" ]; then
    npm install
fi

bower install
rm -rf tmp/*.js
/bin/bash -ex ./release/create-app.sh "$ID"
gulp init --id "$ID" --name "$NAME"  --version "${VERSION}" --build "${BUILD}" --profile "$ID"
gulp default --id "$ID" --name "$NAME" --version "${VERSION}" --build "${BUILD}" --profile "$ID"
cd ./app
/usr/local/bin/cordova-hcp build
cordova prepare ios --verbose
gulp init-ios --id "$ID" --name "$NAME"  --version "${VERSION}" --build "${BUILD}" --profile "$ID"
cordova build android --release --verbose
cd ..
fastlane ios "$ID"
#
cp app/platforms/android/app/build/outputs/apk/release/app-release.apk tmp/${FILENAME}-${VERSION}-${BUILD}.apk
mv tmp/MobileLoop.ipa tmp/${FILENAME}-${VERSION}-${BUILD}.ipa
mv tmp/MobileLoop.app.dSYM.zip tmp/${FILENAME}-${VERSION}-${BUILD}-dSYM.zip
mkdir -p ~/Downloads/builds/${ID}/
cp tmp/${FILENAME}-*-*.{apk,ipa} ~/Downloads/builds/${ID}/
rm -f tmp/${FILENAME}-*-*.{apk,ipa,zip}
