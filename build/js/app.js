(function(window, angular) {
    'use strict';

    document.addEventListener('deviceready', function() {
        console.log("***** device ready *****");
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
        .run(['$rootScope', 'gettextCatalog', 'StorageService', 'config', MobileLoopRun])
    ;

    angular.module('templates', []);
    angular.module('app.services', []);
    angular.module('ui.components', ['templates']);

    function MobileLoopRouter($routeProvider) {
        $routeProvider
            .when('/start', {templateUrl: "start.html" })
            .when('/login', {templateUrl: "login.html" })
            .when('/main', {templateUrl: "main.html" })
            .when('/forgot', {templateUrl: "forgot.html" })
            .otherwise({redirectTo:'/start'});

    }

    function MobileLoopRun($rootScope, gettextCatalog, storageService, config) {

        console.log("Initializing app");

        var ons = window.ons;
        ons.ready(function() {
            console.log("***** onsen ready *****");
            if (!ons.platform.isIOS()) {
                ons.platform.select('android');
            }
        });

        //gettextCatalog.setCurrentLanguage('es');
        //gettextCatalog.debug = (config.id === "mirror");
        //storageService.setLanguageCode('es');

        if(navigator.globalization) {
            navigator.globalization.getPreferredLanguage(
                function (language) {
                    var code = getLanguageCode(language.value);
                    console.log('language: ' + language.value + " code: " + code);
                    if(code !== 'en') {
                        gettextCatalog.setCurrentLanguage(code);
                        gettextCatalog.debug = (config.id === "mirror");
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

        document.addEventListener("menubutton", function () {
            $rootScope.$broadcast("hardware.menubutton");
        }, false);

        document.addEventListener("pause", function () {
            $rootScope.$broadcast("hardware.pause");
        }, false);

        document.addEventListener("resume", function () {
            $rootScope.$broadcast("hardware.resume");

            window.chcp.fetchUpdate(function() {

            });
        }, false);

        document.addEventListener("online", function () {
            $rootScope.$broadcast("hardware.online");
        }, false);

        document.addEventListener("offline", function () {
            $rootScope.$broadcast("hardware.offline");
        }, false);

        document.addEventListener('chcp_updateIsReadyToInstall', function(eventData) {
            var msg = gettextCatalog.getString("A new version is ready to be installed. The application will automatically restart.");
            var update = gettextCatalog.getString("Update");
            navigator.notification.alert(msg, function() {
                window.chcp.installUpdate();
            }, update);

            console.log(JSON.stringify(eventData));
        }, false);

        window.addEventListener("orientationchange", function() {
            $rootScope.$broadcast("orientation.change");
        }, true);
    }
})(window, window.angular);

/*jshint unused:false*/
function browse(url) {
    'use strict';

    window.open(encodeURI(url), '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');
}
