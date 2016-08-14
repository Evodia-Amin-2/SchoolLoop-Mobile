(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('MainController', ['$scope', '$window', '$location', '$timeout', 'DataService', 'DataType', 'StorageService',
            'StatusService', 'NotificationService','UpdateService', 'LoopmailService', MainController])
    ;

    function MainController($scope, $window, $location, $timeout,
             dataService, DataType, storageService, statusService, notificationService,
             updateService, loopmailService) {
        var main = this;

        main.isTeacher = false;

        StatusBar.overlaysWebView(true);
        StatusBar.styleLightContent();
        StatusBar.backgroundColorByHexString("#009688");
        StatusBar.show();

        navigator.analytics.sendAppView('Main');

        updateService.start();
        loopmailService.start();

        $timeout(function() {
            statusService.hideNoWait();
            navigator.splashscreen.hide();
        }, 750);

        if(storageService.isLoggedIn() === false) {
            $location.path('/login');
            return;
        } else {
            notificationService.register();
        }

        // var current = $location.path();
        // if(current.name === "/main") {
        //     if(main.isTeacher) {
        //         console.log("go tab loopmail " + new Date());
        //         $location.path("main.loopmail");
        //     } else {
        //         console.log("go tab assignments " + new Date());
        //         $location.path("main.assignments");
        //     }
        // }

        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("prechange", function() {
            StatusBar.backgroundColorByHexString("#009688");
            StatusBar.show();
        });

        $scope.getMailCount = function() {
            var loopmailList = dataService.listNoReload(DataType.LOOPMAIL);
            if(loopmailList) {
                var unreadList = _.where(loopmailList, {read: "false"});
                return unreadList.length;
            }
            return 0;
        };

        $scope.getNewsCount = function() {
            var newsList = dataService.listNoReload(DataType.NEWS);
            if(newsList) {
                var unreadList = _.where(newsList, {isNew: true});
                return unreadList.length;
            }
            return 0;
        };

        $scope.$on('students.refresh', function() {
            main.students = storageService.getStudents();
        });

        var doExit = false;

        $scope.$on("hardware.backbutton", function() {
            if (doExit === true) {
                navigator.app.exitApp();   // This will exit the application
            }
            if (main.menuVisible === true) {
                main.toggleMenu();
            } else {
                if(history.length > 1) {
                    $timeout(function() {
                        $window.history.back();
                    });
                    history.pop();
                } else {
                    doExit = true;
                }
            }
        });

        main.openMenu = function() {
            $scope.mainSplitter.left.open();
        };

        main.help = function() {
            main.toggleMenu();
            //$window.open("http://www.schoolloop.com/contact-us/support", '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
            $location.path("/main.support");
        };

        main.addStudent = function() {
            main.toggleMenu();
            $location.path("/main.addstudent");
        };

        main.ios = function() {
            return device.platform.toLowerCase() === "ios"; // || main.browser() === true;
        };

        main.android = function() {
            return device.platform.toLowerCase() === "android" || main.browser() === true;
        };

        main.browser = function() {
            return device.platform.toLowerCase() === "browser";
        };
    }
})();
