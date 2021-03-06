/* jshint freeze:false */
(function(window, angular) {
    'use strict';

    document.addEventListener('deviceready', function() {
        console.log("***** device ready *****");
        if(device.uuid === null) {
            device.uuid = "ffffaaaaffffaaaa";
        }
        console.log("Cordova: " + JSON.stringify(device));
        window.open = cordova.InAppBrowser.open;
        if(!navigator.analytics) {
            navigator.analytics = {
                setTrackingId: function() {},
                sendAppView: function() {}
            };
        }

        var app = document.getElementById("mobile-app");
        angular.bootstrap(app, ["mobileloop"]);
    }, false);

    angular.module('mobileloop', ['onsen', 'ngRoute', 'ngSanitize', 'templates', 'gettext', 'app.config',
                                'app.services', 'app.utils', 'ui.components', 'angular-flot'])
        .config(['$routeProvider', MobileLoopRouter])
        .run(['$rootScope', '$location', '$timeout', 'gettextCatalog', 'StorageService', 'config', MobileLoopRun])
    ;

    angular.module('templates', []);
    angular.module('app.services', []);
    angular.module('ui.components', ['templates']);

    function MobileLoopRouter($routeProvider) {
        $routeProvider
            .when('/start', {templateUrl: "start.html" })
            .when('/login', {templateUrl: "login.html" })
            .when('/main', {templateUrl: "main.html" })
            .when('/main-teacher', {templateUrl: "main-teacher.html" })
            .when('/forgot', {templateUrl: "forgot.html" })
            .when('/unverified', {templateUrl: "unverified.html" })
            .when('/invalid', {templateUrl: "invalid.html" })
            .when('/reset', {templateUrl: "reset.html" })
            .when('/notstarted', {templateUrl: "not-started.html" })
            .when('/noschedule', {templateUrl: "no-schedule.html" })
            .when('/agreement-en', {templateUrl: "agreement-en.html" })
            .when('/agreement-es', {templateUrl: "agreement-es.html" })
            .when('/agreement-zh', {templateUrl: "agreement-zh.html" })
            .when('/update', {templateUrl: "update.html" })
            .otherwise({redirectTo:'/start'});

    }

    function MobileLoopRun($rootScope, $location, $timeout, gettextCatalog, storageService, config) {

        console.log("Initializing app");

        var ons = window.ons;
        ons.ready(function() {
            console.log("***** onsen ready *****");
            if (ons.platform.isChrome()) {
                ons.platform.select('android');
            }

            if (ons.platform.isIPhoneX()) { // Utility function
                document.documentElement.setAttribute('onsflag-iphonex-portrait', '');
                document.documentElement.setAttribute('onsflag-iphonex-landscape', '');
            }
        });

        // gettextCatalog.setCurrentLanguage('zh');
        // storageService.setLanguageCode('zh');
        // moment.locale('zh-cn');

        if(navigator.globalization) {
            navigator.globalization.getPreferredLanguage(
                function (language) {
                    var code = getLanguageCode(language.value);
                    console.log('language: ' + language.value + " code: " + code);
                    if(code !== 'en') {
                        gettextCatalog.setCurrentLanguage(code);
                        if(code === 'zh') {
                            code = 'zh-cn';
                        }
                        moment.locale(code);
                    }
                    storageService.setLanguageCode(code);
                },
                function(error) {
                    console.log('Error getting language: ' + error);
                }
            );
        }

        function getLanguageCode(language) {
            var code = language.toLowerCase();
            if(code.startsWith("es")) {
                code = "es";
            } else if(code.startsWith("zh")) {
                code = "zh";
            } else {
                code = "en";
            }
            return code;
        }

        console.log("Starting tracking: " + config.gakey);

        navigator.analytics.setTrackingId(config.gakey);

        document.addEventListener("backbutton", function () {
            $rootScope.$broadcast("hardware.backbutton");
        }, false);

        document.addEventListener("pause", function () {
            $rootScope.$broadcast("hardware.pause");
        }, false);

        document.addEventListener("resume", function () {
            $rootScope.$broadcast("hardware.resume");
        }, false);

        document.addEventListener("online", function () {
            $rootScope.$broadcast("hardware.online");
        }, false);

        document.addEventListener("offline", function () {
            $rootScope.$broadcast("hardware.offline");
        }, false);

        document.addEventListener('chcp_updateIsReadyToInstall', function(eventData) { chcpCallback(eventData, 'chcp_updateIsReadyToInstall', "update.ready"); }, false);
        document.addEventListener('chcp_nothingToUpdate', function(eventData) { chcpCallback(eventData, 'chcp_nothingToUpdate'); }, false);
        document.addEventListener('chcp_updateInstallFailed', function(eventData) { chcpCallback(eventData, 'chcp_updateInstallFailed'); }, false);
        document.addEventListener('chcp_assetsInstallationError', function(eventData) { chcpCallback(eventData, 'chcp_assetsInstallationError'); }, false);

        function chcpCallback(eventData, eventType, action) {
            if (eventData.details && eventData.details.error) {
                var error = eventData.details.error;
                if(error) {
                    console.log('CHCP: Error with code: ' + eventType + " -> " + JSON.stringify(error));
                }
            }
            if(action) {
                console.log('CHCP: Broadcast action: ' + eventType + " -> " + action);
                $rootScope.$broadcast(action);
            }

        }

        window.addEventListener("orientationchange", function() {
            $rootScope.$broadcast("orientation.change");
        }, true);
    }

    String.prototype.startsWith = function (str) {
        return this.indexOf(str) === 0;
    };

    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
})(window, window.angular);

/*jshint unused:false*/
function browse(url) {
    'use strict';
    cordova.InAppBrowser.open(encodeURI(url), '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');
}
