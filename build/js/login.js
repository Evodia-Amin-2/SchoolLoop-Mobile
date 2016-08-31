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

        page.selectedSchool = undefined;

        page.placeholder = {};
        page.placeholder.username = gettextCatalog.getString("User Name");
        page.placeholder.password = gettextCatalog.getString("Password");
        page.placeholder.school = gettextCatalog.getString("School Name");

        page.error = {};
        clearErrors();

        page.lookup = {};
        page.lookup.expanded = false;
        page.lookup.currentPage = 0;
        page.lookup.itemsPerPage = 20;
        page.lookup.displaySet = [];

        page.username = "";
        page.password = "";

        StatusBar.styleDefault();
        StatusBar.show();

        schoolService.list().then(
            function(data) {
                page.schoolList = data;
            }
        );

        page.selectSchool = function(school) {
            clearErrors();

            if(isSchoolDefined(school) === true) {
                storageService.setSchool(school);
                page.selectedSchool = school;
                page.searchParam = school.name;

                var $username = $("#username");
                var $input = $username.find(":input");
                $timeout(function() {
                    $input.focus();
                });
            } else {
                storageService.clear();
                page.selectedSchool = undefined;
                page.searchParam = "";
                page.username = "";
                page.password = "";
                page.submitted = false;
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
            if(page.lookup.displaySet.length === 1) {
                page.selectSchool(page.lookup.displaySet[0]);
            }
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

        $timeout(function() {
            statusService.hideNoWait();
            navigator.splashscreen.hide();
        }, 500);

        var domain = storageService.getDefaultDomain();
        if (_.isUndefined(domain) === false && _.isNull(domain) === false) {
            page.username = domain.user.userName;
            page.password = domain.password || "";
        }

        page.login = function () {
            if(isFormValid()) {
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
                            page.password = "";
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
                            page.submitted = true;
                            page.error.password = gettextCatalog.getString("Login Incorrect!");
                            page.password = "";
                        }
                    }
                );
            } else {
                page.submitted = true;
                if(page.isSchoolSelected(page.selectedSchool) === false) {
                    page.error.school = gettextCatalog.getString("School Required!");
                }
                if(page.username.length === 0) {
                    page.error.username = gettextCatalog.getString("Login Name Required!");
                }
                if(page.password.length === 0) {
                    page.error.password = gettextCatalog.getString("Password Required!");
                }
            }
        };

        page.hasFieldError = function(field) {
            return (page.submitted === true && field.length === 0);
        };

        page.isSchoolSelected = function () {
            return isSchoolDefined(page.selectedSchool) === true;
        };

        function isSchoolDefined(school) {
            return _.isUndefined(school) === false && _.isNull(school) === false && _.isUndefined(school.domainName) === false;
        }

        function isFormValid() {
            clearErrors();
            return _.isUndefined(page.selectedSchool) === false && page.username.length > 0 && page.password.length > 0;
        }

        function clearErrors() {
            page.error.school = "";
            page.error.username = "";
            page.error.password = "";
        }

        page.unverified = function() {
            $location.path('/unverified');
        };

        page.forgot = function() {
            $location.path('/forgot');
        };

        page.register = function () {
            var code = storageService.getLanguageCode();
            var url = "http://" + page.selectedSchool.domainName + "/mobile/app_register?force_language=" + code;
            $window.open(url, '_blank', 'location=yes,clearcache=yes,clearsessioncache=yes');
        };
    }

})();
