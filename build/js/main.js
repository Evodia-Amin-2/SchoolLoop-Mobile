(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('MenuController', ['$location', 'LoginService', 'DataService', 'NotificationService', 'StorageService',
            'config', 'gettextCatalog', MenuController])
        .controller('MainController', ['$scope', '$window', '$location', '$timeout', 'DataService', 'DataType', 'StorageService',
            'StatusService', 'NotificationService','UpdateService', 'LoopmailService', MainController])
    ;

    function MenuController($location, loginService, dataService, notificationService, config, storageService, gettextCatalog) {
        var menu = this;
        menu.user = {};
        menu.school = undefined;
        menu.version = config.version;
        menu.build = config.build;

        var domain = storageService.getDefaultDomain();
        menu.school = domain.school;
        menu.user = domain.user;

        if(menu.user.isParent === 'true' || menu.user.isParent === true) {
            menu.user.isParent = true;
            menu.students = storageService.getStudents();
            menu.selectedStudent = storageService.getSelectedStudentIndex();
            // setCurrentStudent();
        }

        menu.logout = function() {
            loginService.logout().then(
                function(response) {
                    if(String(response.data).indexOf("SUCCESS") === 0) {
                        dataService.clearCache();
                        if(_.isUndefined(menu.school) === false) {
                            storageService.clearPassword(menu.school.domainName);
                        }

                        notificationService.unregister();

                        $location.path("/login");
                    } else {
                        logoutError();
                    }
                },
                function() {
                    logoutError();
                }
            );
        };

        function logoutError() {
            var message = gettextCatalog.getString("There was a problem signing out. Please try again.");
            window.plugins.toast.showLongBottom(message);
        }

    }

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

        $scope.$on('menu.toggle', function() {
            main.toggleMenu();
        });

        var history = [];
        var doExit = false;

        // $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState) {
        //     if(fromState.name === "main") {
        //         history = [];
        //     }
        //
        //     doExit = false;
        //     var last = history[history.length - 1];
        //     if(last !== toState.name || history.length === 0) {
        //         history.push(toState.name);
        //     }
        // });

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

        $scope.$on('hardware.menubutton', function() {
            main.toggleMenu();
        });

        main.openMenu = function() {
            $scope.mainSplitter.left.open();
        };

        main.closeSlideOut = function() {
            console.log("close slide out");
            if(main.menuVisible === true) {
                main.toggleMenu();
            }
        };

        main.debug = function() {
            $location.path("/debug");
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

        main.selectStudent = function(student) {
            storageService.setSelectedStudentId(student.studentID);
            main.selectedStudent = storageService.getSelectedStudentIndex();
            setCurrentStudent();
            main.toggleMenu();
            dataService.clearCache();

            var current = $location.current;
            statusService.showLoading();
            dataService.load().then(function() {
                $location.path(current.name, {}, {reload: true}); //second parameter is for $stateParams
                statusService.hideWait(1000);
            });

        };

        main.isSelected = function(student) {
            return storageService.isSelectedStudent(student.studentID);
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

        function setCurrentStudent() {
            if(main.students.length > 1 && main.selectedStudent < main.students.length) {
                main.currentStudent = main.students[main.selectedStudent];
            }
        }
    }
})();
