(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('MainController', ['$rootScope', '$scope', '$location', '$timeout', 'DataService', 'DataType', 'StorageService',
            'StatusService', 'NotificationService','UpdateService', 'LoopmailService', 'Utils', MainController])
    ;

    function MainController($rootScope, $scope, $location, $timeout,
             dataService, DataType, storageService, statusService, notificationService,
             updateService, loopmailService, utils) {
        var main = this;

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

        var domain = storageService.getDefaultDomain();
        if(utils.isTrue(domain.user.isParent) === true) {
            main.currentStudent = storageService.getSelectedStudent();
        }

        updateService.start();
        loopmailService.start();

        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("prechange", function() {
            StatusBar.backgroundColorByHexString("#009688");
            StatusBar.show();
        });

        if(_.isUndefined(main.currentStudent) === false) {
            tabbar.addEventListener("postchange", function() {
                setupCurrentStudent();
                $scope.$apply();
            });
        }

        function setupCurrentStudent() {
            var index = $scope.tabbar.getActiveTabIndex();
            if(index === 2 || index === 3) {
                main.currentStudentInfo =  main.currentStudent.school.name;
            } else {
                main.currentStudentInfo = main.currentStudent.name;
            }
        }

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

        $scope.doReply = function(action) {
            $rootScope.$broadcast("reply.action", {action: action});
        };

        $scope.$on('filter.reset', function(event, data) {
            $scope.gradeFilter = data.action;
        });

        $scope.$on("refresh.all", function() {
            if (_.isUndefined(main.currentStudent) === false) {
                main.currentStudent = storageService.getSelectedStudent();
                setupCurrentStudent();
            }
            main.getMailCount();
            main.getNewsCount();
        });

        $rootScope.$on('hardware.resume', function() {
            if(storageService.isLoggedIn() === true) {
                var domain = storageService.getDefaultDomain() || {};
                var school = domain.school || {};
                if(school.domainName === "ds2-slb-ca.schoolloop.com") {
                    return;
                }
                window.chcp.fetchUpdate();
            }
        });

        $rootScope.$on('update.ready', function() {
            if(storageService.isLoggedIn() === true) {
                var domain = storageService.getDefaultDomain() || {};
                var school = domain.school || {};
                if(school.domainName === "ds2-slb-ca.schoolloop.com") {
                    return;
                }
                $location.path("/update");
            }
        });

    }
})();
