(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('MainController', ['$rootScope', '$scope', '$location', '$timeout', 'DataService', 'DataType', 'StorageService',
            'StatusService', 'NotificationService','UpdateService', 'LoopmailService', MainController])
    ;

    function MainController($rootScope, $scope, $location, $timeout,
             dataService, DataType, storageService, statusService, notificationService,
             updateService, loopmailService) {
        var main = this;

        main.isTeacher = false;

        StatusBar.overlaysWebView(true);
        StatusBar.styleLightContent();
        StatusBar.backgroundColorByHexString("#009688");
        StatusBar.show();

        $scope.gradeFilter = "all";

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

        navigator.analytics.sendAppView('Main');

        updateService.start();
        loopmailService.start();

        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("prechange", function() {
            StatusBar.backgroundColorByHexString("#009688");
            StatusBar.show();
        });

        main.openMenu = function() {
            $scope.mainSplitter.left.open();
        };

        main.getMailCount = function() {
            var loopmailList = dataService.listNoReload(DataType.LOOPMAIL);
            if(loopmailList) {
                var unreadList = _.where(loopmailList, {read: "false"});
                return unreadList.length;
            }
            return 0;
        };

        main.getNewsCount = function() {
            var newsList = dataService.listNoReload(DataType.NEWS);
            if(newsList) {
                var unreadList = _.where(newsList, {isNew: true});
                return unreadList.length;
            }
            return 0;
        };

        $scope.doFilter = function(action) {
            $rootScope.$broadcast("filter.action", {action: action});
        };

        $scope.$on('filter.reset', function(event, data) {
            $scope.gradeFilter = data.action;
        });

        // var doExit = false;
        // $scope.$on("hardware.backbutton", function() {
        //     if (doExit === true) {
        //         navigator.app.exitApp();   // This will exit the application
        //     }
        //     if (main.menuVisible === true) {
        //         main.toggleMenu();
        //     } else {
        //         if(history.length > 1) {
        //             $timeout(function() {
        //                 $window.history.back();
        //             });
        //             history.pop();
        //         } else {
        //             doExit = true;
        //         }
        //     }
        // });

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

    }
})();
