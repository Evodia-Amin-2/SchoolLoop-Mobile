/*jshint sub:true*/
(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('LoginController', ['$rootScope', '$scope', '$timeout', '$window', '$state', 'SchoolService', 'StorageService',
                    'StatusService', 'LoginService', 'gettextCatalog', LoginController])
        ;

    function LoginController($rootScope, $scope, $timeout, $window, $state, schoolService, storageService,
                             statusService, loginService, gettextCatalog) {
        var login = this;

        login.email = undefined;
        login.selectedSchool = [];
        login.error = undefined;
        login.year = new Date().getFullYear();
        login.loaded = false;

        StatusBar.overlaysWebView(true);
        StatusBar.styleDefault();
        StatusBar.backgroundColorByHexString("#ffffff");
        StatusBar.show();

        function hideStatus() {
            if(login.loaded === true) {
                statusService.hideNoWait();
                navigator.splashscreen.hide();
            } else {
                $timeout(hideStatus, 250);
            }
        }

        $timeout(hideStatus, 100);

        var school = storageService.getSelectedSchool();
        if (_.isUndefined(school) === false && _.isNull(school) === false && _.isUndefined(school.domainName) === false) {
            login.selectedSchool[0] = school;
        }

        var domain = storageService.getDefaultDomain();
        if (_.isUndefined(domain) === false && _.isNull(domain) === false) {
            login.username = domain.user.userName;
            login.password = domain.password;
        }

        login.isSchoolSelected = function () {
            var selected = login.selectedSchool;
            var result = (_.isUndefined(selected) === false && selected.length > 0 && _.isUndefined(selected[0]) === false);
            return result;
        };

        login.schoolLookup = {
            load: function(lookup) {
                schoolService.list().then(
                    function(data) {
                        lookup.data = data;
                        login.loaded = true;
                    }
                );
            }
        };

        $scope.$watch('login.selectedSchool', function (newValue, oldValue) {
            if (newValue !== oldValue && newValue) {
                if (newValue.length > 0) {
                    var school = newValue[0];
                    storageService.setSchool(school);
                } else {
                    storageService.clear();
                    login.username = undefined;
                    login.password = undefined;
                    $scope.login_form.submitted = false;
                    $scope.login_form.$dirty = false;
                    $scope.login_form.$pristine = true;
                }

                $scope.login_form.username.placeholder = "Login Name";
                $scope.login_form.password.placeholder = "Password";
            }
        }, true);

        login.privacy = function () {
            login.auth();
        };

        login.auth = function () {
            if ($scope.login_form.$valid) {
                if(cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.close();
                }

                statusService.showLogin();

                var data;
                loginService.login(login.selectedSchool[0].domainName, login.username, login.password).then(
                    function(message) {
                        data = message.data;
                        storageService.addDomain(login.selectedSchool[0], data, login.password);
                        if(data.isUnverifiedParent === 'true') {
                            storageService.clearPassword(login.selectedSchool[0].domainName);
                            login.password = undefined;
                            $scope.unverified('Parent');
                        } else {
                            storageService.addStudents(login.selectedSchool[0], data.students, true);
                            if (data.acceptedAgreement === 'false') {
                                var languageCode = storageService.getLanguageCode();
                                $state.go('agreement-' + languageCode);
                            } else {
                                $state.go('start');
                            }
                        }
                    },
                    function(error) {
                        statusService.hideNoWait();

                        if (error.status === -1) {
                            return;
                        }
                        if (error.status === 401 && error.data.toLowerCase().startsWith("error 3:")) {
                            data = {"userName": login.username};
                            storageService.addDomain(login.selectedSchool[0], data, null);
                            login.unverified('Student');
                            storageService.clearPassword(login.selectedSchool[0].domainName);
                            login.password = "";
                        } else if(error.status === 400 && error.data.toLowerCase().startsWith("invalid version")) {
                            $state.go('invalid');
                            return;
                        } else if(error.status === 400 && error.data.toLowerCase().startsWith("error 6")) {
                            $state.go('notstarted');
                            return;
                        } else if(error.status === 401 && error.data.toLowerCase().startsWith("error 7")) { // reset
                            storageService.setSchool(login.selectedSchool[0]);
                            var user = {};
                            user.userID = "-999999999";  // temporary user id until an actual login occurs
                            user.userName = login.username;
                            storageService.setPassword(login.selectedSchool[0].domainName, user, login.password);
                            $state.go('reset');
                            return;
                        } else {
                            var isCredError = error.data.toLowerCase().startsWith("error 1:") ||
                                error.data.toLowerCase().startsWith("error 2:");
                            if (isCredError === false) {
                                window.plugins.toast.showLongBottom(error.data);
                                console.log(error.data);
                            } else {
                                var message = gettextCatalog.getString("Invalid Login");
                                window.plugins.toast.showLongBottom(message);
                                console.log(message);
                            }
                            storageService.clearPassword(login.selectedSchool[0].domainName);
                            $scope.login_form.submitted = true;
                            $scope.login_form.password.$invalid = true;
                            $scope.login_form.password.placeholder = gettextCatalog.getString("Login Incorrect!");
                            login.password = "";
                        }
                    }
                );
            } else {
                $scope.login_form.submitted = true;
                $scope.login_form.username.placeholder = gettextCatalog.getString("Login Name Required!");
                $scope.login_form.password.placeholder = gettextCatalog.getString("Password Required!");
            }
        };

        login.unverified = function() {
            $state.go('unverified');
        };

        login.forgot = function() {
            $state.go('forgot');
        };

        login.privacy = function () {
            var code = storageService.getLanguageCode();
            var url = "http://api.schoolloop.com/mobile/app_privacy?force_language=" + code;
            $window.open(url, '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
        };

        login.agreement = function () {
            var code = storageService.getLanguageCode();
            var url = "http://api.schoolloop.com/mobile/app_agreement?force_language=" + code;
            $window.open(url, '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
        };

        login.register = function () {
            var code = storageService.getLanguageCode();
            var url = "http://" + login.selectedSchool[0].domainName + "/mobile/app_register?force_language=" + code;
            $window.open(url, '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
        };


    }

})();
