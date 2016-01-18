(function(window, angular) {
    'use strict';

    document.addEventListener('deviceready', function() {
        console.log("***** device ready *****");
        console.log("Cordova: " + device.cordova);
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

    angular.module('mobileloop', ['ngAnimate', 'ngTouch', 'ngSanitize', 'ui.router', 'ngIOS9UIWebViewPatch', 'gettext', 'ui.components', 'app.config',
                                    'app.services', 'app.utils', 'shoppinpal.mobile-menu', 'ui.bootstrap', 'angular-flot', 'templates'])

        .run(['$rootScope', 'gettextCatalog', 'StorageService', 'UpdateService', 'LoopmailService', 'config',
            function($rootScope, gettextCatalog, storageService, updateService, loopmailService, config) {
                console.log("Initializing app");

                //gettextCatalog.setCurrentLanguage('es');
                //gettextCatalog.debug = (config.id === "mirror");
                //storageService.setLanguageCode('es');

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
                }, false);

                document.addEventListener("online", function () {
                    $rootScope.$broadcast("hardware.online");
                }, false);

                document.addEventListener("offline", function () {
                    $rootScope.$broadcast("hardware.offline");
                }, false);

                window.addEventListener("orientationchange", function() {
                    $rootScope.$broadcast("orientation.change");
                }, true);

                updateService.start();
                loopmailService.start();
            }
        ])
        .config(['$stateProvider', '$urlRouterProvider',
            function($stateProvider, $urlRouterProvider) {
                $stateProvider
                    .state('login', { url: "/login", templateUrl: "login.html" })
                    .state('start', { url: "/start", templateUrl: "start.html" })
                    .state('debug', { url: "/debug", templateUrl: "debug.html" })
                    .state('main', { url: "/main", templateUrl: "main.html" })
                    .state('main.tabs', { url: "/tabs", templateUrl: "main-tabs.html" })
                    .state('main.tabs.assignments', { url: "/assignments", templateUrl: "assignments.html" })
                    .state('main.tabs.assignments-detail', { url: "/assignments/detail/{assignmentId}/{score}/{comment}", templateUrl: "assignment-detail.html" })
                    .state('main.tabs.courses', { url: "/courses", templateUrl: "courses.html" })
                    .state('main.tabs.courses-detail', { url: "/courses/detail/{periodID}", templateUrl: "courses-detail.html" })
                    .state('main.tabs.loopmail', { url: "/loopmail", templateUrl: "loopmail.html" })
                    .state('main.tabs.loopmail-detail', { url: "/loopmail/detail/{loopmailId}", templateUrl: "loopmail-detail.html" })
                    .state('main.tabs.directory', { url: "/directory", templateUrl: "directory.html" })
                    .state('main.tabs.news', { url: "/news", templateUrl: "news.html" })
                    .state('main.tabs.news-detail', { url: "/news/detail/{newsId}", templateUrl: "news-detail.html" })
                    .state('main.compose', { url: "/compose", templateUrl: "compose.html" })
                    .state('main.reply', { url: "/reply/{loopmailId}/{replyAll}", templateUrl: "reply.html" })
                    .state('main.addstudent', { url: "/addstudent", templateUrl: "add-student.html" })
                    .state('main.support', { url: "/support", templateUrl: "support.html" })
                    .state('unverified', { url: "/unverified", templateUrl: "unverified.html" })
                    .state('invalid', { url: "/invalid", templateUrl: "invalid.html" })
                    .state('forgot', { url: "/forgot", templateUrl: "forgot.html" })
                    .state('reset', { url: "/reset", templateUrl: "reset.html" })
                    .state('notstarted', { url: "/notstarted", templateUrl: "not-started.html" })
                    .state('agreement-en', { url: "/agreement-en", templateUrl: "agreement-en.html" })
                    .state('agreement-es', { url: "/agreement-es", templateUrl: "agreement-es.html" })
                    .state('agreement-zh', { url: "/agreement-zh", templateUrl: "agreement-zh.html" })
                ;
                $urlRouterProvider.otherwise("/start");
            }
        ])
    ;

    angular.module('templates', []);

    angular.module('app.services', ['ngResource']);
    angular.module('ui.components', ['templates']);

        /* jshint freeze:false */
    String.prototype.startsWith = function (str) {
        return this.indexOf(str) === 0;
    };

    /* jshint freeze:false */
    String.prototype.endsWith = function (suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };

})(window, window.angular);

/*jshint unused:false*/
function browse(url) {
    'use strict';

    window.open(encodeURI(url), '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');
}
