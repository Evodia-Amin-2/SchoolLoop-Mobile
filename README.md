# MobileLoop

## Environment
    Install nodejs: https://nodejs.org/
    Install cordova: http://cordova.apache.org/docs/en/4.0.0/guide_cli_index.md.html#The%20Command-Line%20Interface
    Android Studio
    Xcode
    npm install -g ios-sim
    npm install bower -g
    ant: http://www.rendered-dreams.com/blog/2014/2/24/Quickly-Install-Apache-ANT-on-Mac-OS-X

## Steps to create project
    cordova create mobile_loop com.schoolloop.mobileloop.app SchoolLoop
    cordova platform add android
    cordova platform add ios
    cordova platform add browser
    cordova plugin add org.apache.cordova.console
    cordova plugin add org.apache.cordova.device
    cordova plugin add org.apache.cordova.dialogs
    cordova plugin add org.apache.cordova.globalization
    cordova plugin add org.apache.cordova.inappbrowser
    cordova plugin add org.apache.cordova.splashscreen
    cordova plugin add org.apache.cordova.statusbar
    cordova plugin add org.apache.cordova.vibration
    cordova plugin add hu.dpal.phonegap.plugins.spinnerdialog
    cordova plugin add net.yoik.cordova.plugins.screenorientation
    cordova plugin add nl.x-services.plugins.toast
    cordova plugin add com.ionic.keyboard
    cordova plugin add com.danielcwilson.plugins.googleanalytics
    cordova plugin add com.google.playservices
    cordova plugin add com.testfairy.cordova-plugin
    cordova plugin add com.phonegap.plugins.PushPlugin

### config.xml
1. Add splash screens and icons
2. Add prefs:


    <feature name="StatusBar">
        <param name="ios-package" value="CDVStatusBar" onload="true"/>
    </feature>
    <preference name="webviewbounce" value="false"/>
    <preference name="UIWebViewBounce" value="false"/>
    <preference name="DisallowOverscroll" value="true"/>
    <preference name="BackupWebStorage" value="none"/>
    <preference name="SplashScreenDelay" value="10000" />
    <preference name="SplashScreen" value="screen" />


### config.json
1. Set app specific config: api, version, keys...

### platforms
1. Configure orientation in AndroidManifest.xml
2. Configure orientation in xcode project
3. Change display name in xcode

# Build
    npm install
    bower install
    gulp
    cordova build

## android
    adb connect 192.168.10.230
    cordova run android
    (alternativeley: gulp android)
    adb logcat CordovaLog:D *:S

## ios
    ** Must first ensure the xcode dev tools are installed **

    cordova emulate ios
    (alternativeley: gulp ios)

## browser
    cordova run browser
    (alternativeley: gulp browser)

