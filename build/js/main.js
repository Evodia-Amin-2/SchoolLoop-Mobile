(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('MainController', ['$rootScope', '$scope', '$location', '$timeout', 'DataService', 'DataType', 'StorageService',
            'StatusService', 'NotificationService','UpdateService', 'LoopmailService', 'Utils', 'gettextCatalog', MainController])
    ;

    function MainController($rootScope, $scope, $location, $timeout,
             dataService, DataType, storageService, statusService, notificationService,
             updateService, loopmailService, utils, gettextCatalog) {
        var main = this;

        main.isLoaded = false;

        loadStudents();

        StatusBar.overlaysWebView(true);
        StatusBar.styleLightContent();
        StatusBar.backgroundColorByHexString("#009688");
        StatusBar.show();

        $scope.gradeFilter = "all";

        $timeout(function() {
            statusService.hideNoWait();
            navigator.splashscreen.hide();
            main.isLoaded = true;
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
        checkForUpdate();

        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("prechange", function() {
            utils.setStatusBar("#009688");
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

        main.showStudentMenu = function() {
            var index = $scope.tabbar.getActiveTabIndex();
            if(index === 2 || index === 3) {
                return false;
            }
            return main.students.length > 0;
        };

        main.studentMenu = function() {
            if(main.showStudentMenu() === false) {
                return;
            }

            loadStudents();

            if($scope.studentMenu._element[0].visible === false) {
                $scope.studentMenu.show('.student-menu-popover');
            }
        };

        function loadStudents() {
            var students = storageService.getStudents();
            var currentStudent = storageService.getSelectedStudent();
            if(_.isUndefined(currentStudent) === false) {
                main.students = _.without(students, _.findWhere(students, {studentID: currentStudent.studentID}));
            }
        }

        main.selectStudent = function(student) {
            storageService.setSelectedStudentId(student.studentID);

            dataService.clearCache();
            $scope.studentMenu.hide();
            var message = gettextCatalog.getString("Switching to {}");
            message = message.replace("{}", student.name);
            statusService.showMessage(message);
            dataService.load().then(function() {
                statusService.hideWait(1000);
                $rootScope.$broadcast("refresh.all");
            });
        };

        $scope.$on('filter.reset', function(event, data) {
            $scope.gradeFilter = data.action;
        });

        $scope.$on("refresh.all", function() {
            if (_.isUndefined(main.currentStudent) === false) {
                main.currentStudent = storageService.getSelectedStudent();
                setupCurrentStudent();
            }

            loadStudents();

            main.getMailCount();
            main.getNewsCount();
        });

        $rootScope.$on('hardware.resume', function() {
            checkForUpdate();
        });

        var retryInterval = 15000;

        $rootScope.$on('update.ready', function() {
            updateReady();
        });

        function checkForUpdate() {
            if(storageService.isLoggedIn() === true) {
                var domain = storageService.getDefaultDomain() || {};
                var school = domain.school || {};
                if(school.domainName === "ds2-slb-ca.schoolloop.com") {
                    return;
                }
                window.chcp.fetchUpdate();
            }
        }

        function updateReady() {
            if(storageService.isLoggedIn() === true) {
                var domain = storageService.getDefaultDomain() || {};
                var school = domain.school || {};
                if(school.domainName === "ds2-slb-ca.schoolloop.com") {
                    return;
                }
                $location.path("/update");
            } else {
                if(retryInterval < 500000) {
                    $timeout(updateReady, retryInterval);
                    retryInterval = retryInterval * 2;
                }
            }
        }

    }
})();
