(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ChangeSchoolController', ['$scope', '$timeout', 'LoginService', 'StorageService',
            'SchoolService', 'gettextCatalog', ChangeSchoolController])
    ;

    function ChangeSchoolController($scope, $timeout, loginService, storageService, schoolService, gettextCatalog) {
        var page = this;

        page.addCallback = $scope.mainNavigator.topPage.pushedOptions.addCallback;

        var domain = storageService.getDefaultDomain();
        page.username = domain.user.userName;
        page.password = domain.user.hashedPassword;

        page.selectedSchool = "";
        page.searchParam = "";
        page.authFailed = false;

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

        page.schoolList = [];

        schoolService.list().then(
            function(data) {
                page.schoolList = data;
            }
        );

        $scope.$on("refresh.modal", function() {
            page.selectedSchool = "";
            page.searchParam = "";
            page.authFailed = false;
        });

        page.isSchoolSelected = function () {
            return isSchoolDefined(page.selectedSchool) === true;
        };

        page.selectSchool = function(school) {
            if(isSchoolDefined(school) === true) {
                page.selectedSchool = school;
                page.searchParam = school.name;

                var $input = $(".lookup-input");
                $timeout(function() {
                    $input.blur();
                }, 100);
            } else {
                page.selectedSchool = undefined;
                page.searchParam = "";
                page.submitted = false;
                page.authFailed = false;
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
            clearErrors();
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
            } else if(page.lookup.displaySet.length === 0) {
                page.selectedSchool = "";
            }
        }

        page.select = function() {
            if(_.isUndefined(page.selectedSchool) === false) {
                clearErrors();
                var newSchool = page.selectedSchool;
                loginService.login(newSchool.domainName, page.username, page.password).then(
                    function(response) {
                        processSuccess(response, newSchool, response.data.hashedPassword);
                    },
                    function(error) {
                        processFailure(error);
                    }
                );
            }
        };

        function processSuccess(response, school, password) {
            var data = response.data;
            if (data.isUnverifiedParent === 'true') {
                page.message = gettextCatalog.getString("Parent needs to be verified");
            } else {
                $scope.mainNavigator.popPage();
                page.addCallback(school, data, password);
            }
        }

        function processFailure(error) {
            var status = error.data;
            var isCredError = status.toLowerCase().startsWith("error 1:") ||
                status.toLowerCase().startsWith("error 2:");
            if(isCredError === true) {
                page.authFailed = true;
                page.password = "";
                page.error.school =  gettextCatalog.getString("Invalid Login");
            }
            page.message = "";
            console.log(error);
        }

        function isSearchDefined() {
            return _.isUndefined(page.searchParam) === false && page.searchParam.length > 0;
        }

        function clearDisplaySet() {
            page.lookup.displaySet = [];
            page.lookup.currentPage = 0;
            //$('.lookup-content').scrollTop(0);
        }

        function clearErrors() {
            page.error.school = "";
            page.error.username = "";
            page.error.password = "";
        }

        function isSchoolDefined(school) {
            return _.isUndefined(school) === false && _.isNull(school) === false && _.isUndefined(school.domainName) === false;
        }
    }
})();
