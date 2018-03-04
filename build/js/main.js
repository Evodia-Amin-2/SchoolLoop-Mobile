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

        var navStack = [];

        main.isLoaded = true;

        loadStudents();

        StatusBar.overlaysWebView(true);
        StatusBar.styleLightContent();
        StatusBar.backgroundColorByHexString("#009688");
        StatusBar.show();

        $scope.gradeFilter = "all";

        $scope.calFilter = {
            assigned: false,
            due: true,
            general: true,
            group: true
        };

        $timeout(function() {
            statusService.hideNoWait();
            navigator.splashscreen.hide();
            main.isLoaded = true;

            main.setupTab("Assignments", 0);

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

            setupCurrentStudent();
        }

        updateService.start();
        loopmailService.start();
        checkForUpdate();

        main.setupTab = function(title, index) {
            main.tabTitle = title;
            main.tabIndex = index;
        };

        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("prechange", function(event) {
            utils.setStatusBar("#009688");

            var title = event.tabItem.children[1].innerText;

            var index = event.index;
            main.setupTab(title, index);

            setupCurrentStudent(index);
        });

        tabbar.addEventListener("postchange", function() {
            var index = tabbar.getActiveTabIndex();
            navStack.push(index);
        });

        $scope.$on("hardware.backbutton", function() {
            if(storageService.getBackButtonExit() === false) {
                return;
            }
            if(navStack.length <= 1) {
                navigator.app.exitApp(); // Close the app
            } else {
                var currentTab = tabbar.getActiveTabIndex();
                var lastTab = navStack.pop();
                if(lastTab === currentTab) {
                    lastTab = navStack.pop();
                }
                $scope.tabbar.setActiveTab(lastTab);

            }
        });

        var numTabs = tabbar.children[1].childElementCount;
        var divGD = window.ons.GestureDetector(document.querySelector('#page-content'));
        divGD.on('swipeleft', function(event) {
            if (utils.hasParent(event.srcElement, "calendar") === true) {
                $rootScope.$broadcast("swipe.left", {action: "calendar"});
                return;
            }

            if(storageService.getBackButtonExit() === false) {
                return;
            }
            var currentTab = tabbar.getActiveTabIndex();
            $scope.tabbar.setActiveTab((currentTab + 1) % numTabs, {animation: 'slide'});
        });

        divGD.on('swiperight', function(event) {
            if (utils.hasParent(event.srcElement, "calendar") === true) {
                $rootScope.$broadcast("swipe.right", {action: "calendar"});
                return;
            }

            if(storageService.getBackButtonExit() === false) {
                return;
            }
            var currentTab = tabbar.getActiveTabIndex();
            currentTab = (currentTab + numTabs - 1) % numTabs;
            $scope.tabbar.setActiveTab(currentTab, {animation: 'slide'});
        });

        function setupCurrentStudent(tabIndex) {
            if(_.isUndefined(main.currentStudent) === false) {
                main.currentStudentInfo = main.currentStudent.name;
                if(_.isUndefined(tabIndex) === true) {
                    var tabbar = document.querySelector("ons-tabbar");
                    tabIndex = tabbar.getActiveTabIndex();
                }
                if(tabIndex === 2 || tabIndex === 3) {
                    main.currentStudentInfo =  main.currentStudent.school.name;
                }
            }
        }

        main.load = function($done) {
            $rootScope.$broadcast("pulldown.refresh", {tabIndex: main.tabIndex, done: $done});
        };

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

            $scope.studentPopover.show(".student-popover");
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
            $scope.studentPopover.hide();
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
            var currentTab = tabbar.getActiveTabIndex();
            navStack = [currentTab];
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
