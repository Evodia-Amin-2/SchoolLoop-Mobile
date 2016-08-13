/*jshint sub:true*/
(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('LoginController', ['$scope', '$timeout', '$window', '$location', 'StorageService',
                    'StatusService', 'LoginService', 'SchoolService', 'gettextCatalog', LoginController])
        ;

    function LoginController($scope, $timeout, $window, $location, storageService,
                             statusService, loginService, schoolService, gettextCatalog) {
        var page = this;

        page.email = undefined;
        page.selectedSchool = undefined;
        page.error = undefined;
        page.year = new Date().getFullYear();
        page.loaded = false;

        page.placeholder = {};
        page.placeholder.username = gettextCatalog.getString("User Name");
        page.placeholder.password = gettextCatalog.getString("Password");
        page.placeholder.school = gettextCatalog.getString("School Name");

        page.lookup = {};
        page.lookup.expanded = false;
        page.lookup.currentPage = 0;
        page.lookup.itemsPerPage = 20;
        page.lookup.displaySet = [];

        StatusBar.styleDefault();
        StatusBar.show();

        schoolService.list().then(
            function(data) {
                page.schoolList = data;
            }
        );

        page.selectSchool = function(school) {
            if(isSchoolDefined(school) === true) {
                storageService.setSchool(school);
                page.selectedSchool = school;
                page.searchParam = school.name;
            } else {
                storageService.clear();
                page.selectedSchool = undefined;
                page.searchParam = "";
                page.username = "";
                page.password = "";
                $scope.login_form.submitted = false;
                $scope.login_form.$dirty = false;
                $scope.login_form.$pristine = true;
            }
            page.lookup.expanded = false;
        };

        page.expand = function() {
            clearDisplaySet();
            loadData();
            page.lookup.expanded = true;
        };

        page.clear = function() {
            page.selectSchool();
        };

        page.showClear = function() {
            return _.isUndefined(page.selectedSchool) === false || isSearchDefined() || page.lookup.expanded === true;
        };

        page.change = function() {
            console.log("calling change: " + page.searchParam);
            page.lookup.expanded = (page.searchParam && page.searchParam.length > 0);
            clearDisplaySet();
            loadData();
        };

        function loadData() {
            if(_.isUndefined(page.schoolList) === true) {
                return;
            }
            var start = page.lookup.currentPage * page.lookup.itemsPerPage;
            var end = start + page.lookup.itemsPerPage;
            var results = page.schoolList;
            var i, len, item, queryRegExp = null;
            if(isSearchDefined()) {
                results = [];
                queryRegExp = RegExp(page.searchParam, 'i'); //'i' -> case insensitive
                for(i = start, len = page.schoolList.length; i < len; i++) {
                    item = page.schoolList[i];
                    if(item.name.match(queryRegExp) || item.districtName.match(queryRegExp)) {
                        results.push(item);
                    }
                    if(results.length > end) {
                        break;
                    }
                }
            }
            for(i = start, len = results.length; i < len && i < end; i++) {
                item = results[i];
                page.lookup.displaySet.push(item);
            }
            // if(page.lookup.displaySet.length === 1) {
            //     page.selectSchool(page.lookup.displaySet[0]);
            // }
        }

        function isSearchDefined() {
            return _.isUndefined(page.searchParam) === false && page.searchParam.length > 0;
        }

        function clearDisplaySet() {
            page.lookup.displaySet = [];
            page.lookup.currentPage = 0;
            //$('.lookup-content').scrollTop(0);
        }

        var school = storageService.getSelectedSchool();
        if(isSchoolDefined(school) === true) {
            page.selectedSchool = school;
            page.searchParam = school.name;
        }




        page.inputStyle = "text-input text-input--underbar";
        if(window.ons.platform.isAndroid()) {
            page.inputStyle += " text-input--material";
        }

        // StatusBar.overlaysWebView(true);
        // StatusBar.styleDefault();
        // StatusBar.show();

        $timeout(function() {
            statusService.hideNoWait();
            navigator.splashscreen.hide();
        }, 750);

        var domain = storageService.getDefaultDomain();
        if (_.isUndefined(domain) === false && _.isNull(domain) === false) {
            page.username = domain.user.userName;
            page.password = domain.password;
        }

        page.isSchoolSelected = function () {
            return isSchoolDefined(page.selectedSchool) === true;
        };

        function isSchoolDefined(school) {
            return _.isUndefined(school) === false && _.isNull(school) === false && _.isUndefined(school.domainName) === false;
        }

        page.privacy = function () {
            page.auth();
        };

        page.login = function () {
            if ($scope.login_form.$valid) {
                if(cordova.plugins.Keyboard) {
                    cordova.plugins.Keyboard.close();
                }

                statusService.showLogin();

                var data;
                loginService.login(page.selectedSchool.domainName, page.username, page.password).then(
                    function(message) {
                        data = message.data;
                        storageService.addDomain(page.selectedSchool, data, page.password);
                        if(data.isUnverifiedParent === 'true') {
                            storageService.clearPassword(page.selectedSchool.domainName);
                            page.password = undefined;
                            $scope.unverified('Parent');
                        } else {
                            storageService.addStudents(page.selectedSchool, data.students, true);
                            if (data.acceptedAgreement === 'false') {
                                var languageCode = storageService.getLanguageCode();
                                $location.path('/agreement-' + languageCode);
                            } else {
                                $location.path('/start');
                            }
                        }
                    },
                    function(error) {
                        statusService.hideNoWait();

                        if (error.status === -1) {
                            return;
                        }
                        if (error.status === 401 && error.data.toLowerCase().startsWith("error 3:")) {
                            data = {"userName": page.username};
                            storageService.addDomain(page.selectedSchool, data, null);
                            page.unverified('Student');
                            storageService.clearPassword(page.selectedSchool.domainName);
                            page.password = "";
                        } else if(error.status === 400 && error.data.toLowerCase().startsWith("invalid version")) {
                            $location.path('/invalid');
                            return;
                        } else if(error.status === 400 && error.data.toLowerCase().startsWith("error 6")) {
                            $location.path('/notstarted');
                            return;
                        } else if(error.status === 401 && error.data.toLowerCase().startsWith("error 7")) { // reset
                            storageService.setSchool(page.selectedSchool);
                            var user = {};
                            user.userID = "-999999999";  // temporary user id until an actual login occurs
                            user.userName = page.username;
                            storageService.setPassword(page.selectedSchool.domainName, user, page.password);
                            $location.path('/reset');
                            return;
                        } else if(error.status === 401 && error.data.toLowerCase().startsWith("error 8")) {
                            $location.path('/noschedule');
                            return;
                        } else {
                            var message;
                            var isCredError = error.data.toLowerCase().startsWith("error 1:") ||
                                error.data.toLowerCase().startsWith("error 2:");
                            if (isCredError === false) {
                                window.plugins.toast.showLongBottom(error.data);
                                console.log(error.data);
                            } else if(error.data.toLowerCase().startsWith("error 5:")) {
                                message = gettextCatalog.getString("Your access to this account has been blocked by a school administrator.");
                                window.plugins.toast.showLongBottom(message);
                                console.log(message);
                            } else {
                                message = gettextCatalog.getString("Invalid Login");
                                window.plugins.toast.showLongBottom(message);
                                console.log(message);
                            }
                            storageService.clearPassword(page.selectedSchool.domainName);
                            $scope.login_form.submitted = true;
                            $scope.login_form.password.$invalid = true;
                            $scope.login_form.password.placeholder = gettextCatalog.getString("Login Incorrect!");
                            page.password = "";
                        }
                    }
                );
            } else {
                $scope.login_form.submitted = true;
                $scope.login_form.username.placeholder = gettextCatalog.getString("Login Name Required!");
                $scope.login_form.password.placeholder = gettextCatalog.getString("Password Required!");
            }
        };

        page.unverified = function() {
            $location.path('/unverified');
        };

        page.forgot = function() {
            $location.path('/forgot');
        };

        page.privacy = function () {
            var code = storageService.getLanguageCode();
            var url = "http://api.schoolloop.com/mobile/app_privacy?force_language=" + code;
            $window.open(url, '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
        };

        page.agreement = function () {
            var code = storageService.getLanguageCode();
            var url = "http://api.schoolloop.com/mobile/app_agreement?force_language=" + code;
            $window.open(url, '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
        };

        page.register = function () {
            var code = storageService.getLanguageCode();
            var url = "http://" + page.selectedSchool.domainName + "/mobile/app_register?force_language=" + code;
            $window.open(url, '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
        };


    }

})();
