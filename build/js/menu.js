(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('MenuController', ['$rootScope', '$scope', '$location', '$window', 'DataService', 'StorageService', 'LoginService',
            'StatusService', 'NotificationService', 'gettextCatalog', 'config', 'Utils', MenuController])
    ;

    function MenuController($rootScope, $scope, $location, $window, dataService, storageService, loginService,
                            statusService, notificationService, gettextCatalog, config, utils) {
        var menu = this;

        menu.school = undefined;
        menu.currentStudent = undefined;
        menu.version = config.version;
        menu.build = config.build;
        menu.isTeacher = false;

        var domain = storageService.getDefaultDomain();
        menu.school = domain.school;
        menu.user = domain.user;

        if(utils.isTrue(menu.user.isParent) === true) {
            menu.user.isParent = true;
            menu.students = storageService.getStudents();
        }
        menu.isTeacher = (menu.user.role !== 'student' && menu.user.role !== 'parent');

        menu.action = function(page) {
            menu.closeMenu();
            $scope.mainNavigator.pushPage(page, {animation: 'slide'});
        };

        menu.closeMenu = function() {
            $scope.mainSplitter.left.close();
        };

        menu.selectStudent = function(student) {
            storageService.setSelectedStudentId(student.studentID);
            dataService.clearCache();

            statusService.showLoading();
            dataService.load().then(function() {
                statusService.hideWait(1000);
                menu.closeMenu();
                $rootScope.$broadcast("refresh.all");
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

        menu.agreement = function () {
            menu.closeMenu();
            var code = storageService.getLanguageCode();
            var url = "http://api.schoolloop.com/mobile/app_agreement?force_language=" + code;
            $window.open(url, '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
        };

        menu.privacy = function () {
            menu.closeMenu();
            var code = storageService.getLanguageCode();
            var url = "http://api.schoolloop.com/mobile/app_privacy?force_language=" + code;
            $window.open(url, '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
        };

        menu.security = function () {
            menu.closeMenu();
            var code = storageService.getLanguageCode();
            var url = "http://api.schoolloop.com/mobile/app_security?force_language=" + code;
            $window.open(url, '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
        };

        function logoutError() {
            var message = gettextCatalog.getString("There was a problem signing out. Please try again.");
            window.plugins.toast.showLongBottom(message);
        }
    }
})();
