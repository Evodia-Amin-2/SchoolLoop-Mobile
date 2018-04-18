#!/bin/bash

APP_ID=$1

if [ ! -d "app" ]; then
    cordova create app com.schoolloop.mobileloop.$APP_ID MobileLoop
    cd app
    cordova platform add ios android browser --save
    cordova plugin add cordova-plugin-device@2.0.1 --save
    cordova plugin add cordova-plugin-dialogs@2.0.1 --save
    cordova plugin add cordova-plugin-inappbrowser@2.0.2 --save
    cordova plugin add cordova-plugin-screen-orientation@3.0.1 --save
    cordova plugin add cordova-plugin-splashscreen@5.0.2 --save
    cordova plugin add cordova-plugin-statusbar@2.4.1 --save
    cordova plugin add cordova-plugin-vibration@3.0.1 --save
    cordova plugin add cordova-plugin-whitelist@1.3.3 --save
    cordova plugin add cordova-plugin-x-toast@2.6.0 --save
    cordova plugin add cordova-plugin-spinner-dialog@1.3.1 --save

#    cordova plugin add https://github.com/amritk/cordova-plugin-firebase

    cordova plugin add com.cmackay.plugins.googleanalytics --save
    cordova plugin add phonegap-plugin-push@1.11.1 --variable SENDER_ID="497458348283" --save
    cordova plugin add cordova-hot-code-push-plugin@1.5.3 --save

    rm -rf res/icon/*
    rm -rf res/screen/*
    rm -rf platforms/android/app/src/main/res/drawable-*/icon.png
    rm -rf platforms/android/app/src/main/res/mipmap-*/icon.png
    rm -rf platforms/ios/MobileLoop/Images.xcassets/*/*.*
    cd ..

#    cp -r build/custom/xcshareddata app/platforms/ios/MobileLoop.xcodeproj/
    cp build/custom/build.json app/
#    cp build/custom/PushPlugin.m app/platforms/ios/MobileLoop/Plugins/phonegap-plugin-push/PushPlugin.m
    cp build/versions/.chcplogin app/
    cp build/versions/$APP_ID/cordova-hcp.json app/
    ./release/update-xcode.sh $APP_ID
else
    echo "MobileLoop project already exists"
fi
