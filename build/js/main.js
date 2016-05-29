(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('MainController', ['$rootScope', '$scope', '$window', '$state', '$timeout', '$spMenu',
            'DataService', 'DataType', 'StorageService', 'LoginService', 'StatusService', 'NotificationService', 'gettextCatalog', 'config',
            function($rootScope, $scope, $window, $state, $timeout, $spMenu,
                     dataService, DataType, storageService, loginService, statusService, notificationService, gettextCatalog, config) {
                var main = this;
                main.menuVisible = false;
                main.user = {};
                main.school = undefined;
                main.currentStudent = undefined;
                main.version = config.version;
                main.build = config.build;
                main.isTeacher = false;

                StatusBar.overlaysWebView(true);
                StatusBar.styleLightContent();
                StatusBar.show();

                navigator.analytics.sendAppView('Main');

                $timeout(function() {
                    statusService.hideNoWait();
                    navigator.splashscreen.hide();
                }, 750);

                if(storageService.isLoggedIn() === false) {
                    $state.go('login');
                    return;
                } else {
                    notificationService.register();
                }

                var domain = storageService.getDefaultDomain();
                main.school = domain.school;
                main.user = domain.user;

                if(main.user.isParent === 'true') {
                    main.students = storageService.getStudents();
                    main.selectedStudent = storageService.getSelectedStudentIndex();
                    setCurrentStudent();
                }
                main.isTeacher = (main.user.role !== 'student' && main.user.role !== 'parent');

                main.debugEnabled = config.id === "mirror";

                var current = $state.current;
                if(current.name === "main") {
                    if(main.isTeacher) {
                        console.log("go tab loopmail " + new Date());
                        $state.go("main.tabs.loopmail");
                    } else {
                        console.log("go tab assignments " + new Date());
                        $state.go("main.tabs.assignments");
                    }
                }

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

                $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState) {
                    if(fromState.name === "main") {
                        history = [];
                    }

                    doExit = false;
                    var last = history[history.length - 1];
                    if(last !== toState.name || history.length === 0) {
                        history.push(toState.name);
                    }
                });

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

                main.toggleMenu = function() {
                    main.menuVisible = !main.menuVisible;
                    $timeout(function() {
                        $spMenu.toggle();
                    });
                };

                main.closeSlideOut = function() {
                    console.log("close slide out");
                    if(main.menuVisible === true) {
                        main.toggleMenu();
                    }
                };

                main.debug = function() {
                    $state.go("debug");
                };

                main.help = function() {
                    main.toggleMenu();
                    //$window.open("http://www.schoolloop.com/contact-us/support", '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
                    $state.go("main.support");
                };

                main.addStudent = function() {
                    main.toggleMenu();
                    $state.go("main.addstudent");
                };

                main.selectStudent = function(student) {
                    storageService.setSelectedStudentId(student.studentID);
                    main.selectedStudent = storageService.getSelectedStudentIndex();
                    setCurrentStudent();
                    main.toggleMenu();
                    dataService.clearCache();

                    var current = $state.current;
                    statusService.showLoading();
                    dataService.load().then(function() {
                        $state.go(current.name, {}, {reload: true}); //second parameter is for $stateParams
                        statusService.hideWait(1000);
                    });

                };

                main.isSelected = function(student) {
                    return storageService.isSelectedStudent(student.studentID);
                };

                main.logout = function() {
                    loginService.logout().then(
                        function(response) {
                            if(String(response.data).indexOf("SUCCESS") === 0) {
                                dataService.clearCache();
                                if(_.isUndefined(main.school) === false) {
                                    storageService.clearPassword(main.school.domainName);
                                }

                                notificationService.unregister();

                                $state.go("login");
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
        ])
    ;
})();
