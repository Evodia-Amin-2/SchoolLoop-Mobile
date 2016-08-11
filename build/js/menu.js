(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('MenuController', ['$location', 'DataService', 'StorageService', 'LoginService',
            'StatusService', 'NotificationService', 'gettextCatalog', 'config', MenuController])
    ;

    function MenuController($location, dataService, storageService, loginService,
                            statusService, notificationService, gettextCatalog, config) {
        var menu = this;
        menu.school = undefined;
        menu.currentStudent = undefined;
        menu.version = config.version;
        menu.build = config.build;
        menu.isTeacher = false;

        var domain = storageService.getDefaultDomain();
        menu.school = domain.school;
        menu.user = domain.user;

        if(menu.user.isParent === 'true' || menu.user.isParent === true) {
            menu.user.isParent = true;
            menu.students = storageService.getStudents();
            menu.selectedStudent = storageService.getSelectedStudentIndex();
            setCurrentStudent();
        }
        menu.isTeacher = (menu.user.role !== 'student' && menu.user.role !== 'parent');

        menu.debugEnabled = config.id === "mirror";

        menu.debug = function() {
            $location.path("/debug");
        };

        menu.help = function() {
            menu.toggleMenu();
            //$window.open("http://www.schoolloop.com/contact-us/support", '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
            $location.path("/main.support");
        };

        menu.addStudent = function() {
            menu.toggleMenu();
            $location.path("/main.addstudent");
        };

        menu.selectStudent = function(student) {
            storageService.setSelectedStudentId(student.studentID);
            menu.selectedStudent = storageService.getSelectedStudentIndex();
            setCurrentStudent();
            menu.toggleMenu();
            dataService.clearCache();

            var current = $location.current;
            statusService.showLoading();
            dataService.load().then(function() {
                $location.path(current.name, {}, {reload: true}); //second parameter is for $stateParams
                statusService.hideWait(1000);
            });

        };

        menu.isSelected = function(student) {
            return storageService.isSelectedStudent(student.studentID);
        };

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

        menu.ios = function() {
            return device.platform.toLowerCase() === "ios"; // || main.browser() === true;
        };

        menu.android = function() {
            return device.platform.toLowerCase() === "android" || menu.browser() === true;
        };

        menu.browser = function() {
            return device.platform.toLowerCase() === "browser";
        };

        function setCurrentStudent() {
            if(menu.students.length > 1 && menu.selectedStudent < menu.students.length) {
                menu.currentStudent = menu.students[menu.selectedStudent];
            }
        }
    }
})();
