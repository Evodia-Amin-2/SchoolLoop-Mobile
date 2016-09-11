(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('SchoolSearchController', ['$scope', '$timeout', 'LoginService', 'StorageService',
            'SchoolService', 'gettextCatalog', SchoolSearchController])
    ;

    function SchoolSearchController($scope, $timeout, loginService, storageService, schoolService, gettextCatalog) {
        var page = this;

        page.searchCallback = $scope.loginNavigator.topPage.pushedOptions.searchCallback;

        page.selectedSchool = "";
        page.searchParam = "";
        page.disabled = false;

        page.placeholder = {};
        page.placeholder.school = gettextCatalog.getString("School Name");

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
        });

        page.isSchoolSelected = function () {
            return isSchoolDefined(page.selectedSchool) === true;
        };

        page.selectSchool = function(school) {
            if(isSchoolDefined(school) === true) {
                page.selectedSchool = school;
                page.searchParam = school.name;
                page.lookup.expanded = false;
                page.disabled = true;
                $timeout(function() {
                    page.searchCallback(page.selectedSchool);
                }, 750);
            }
        };

        page.expand = function() {
            clearDisplaySet();
            loadData();
            page.lookup.expanded = true;
        };

        page.clear = function() {
            page.selectedSchool = undefined;
            page.searchParam = "";
            page.lookup.expanded = false;
        };

        page.showClear = function() {
            return _.isUndefined(page.selectedSchool) === false || isSearchDefined() || page.lookup.expanded === true;
        };

        page.change = function() {
            if(isSchoolDefined(page.selectedSchool) === true) {
                return;
            }
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

        function isSearchDefined() {
            return _.isUndefined(page.searchParam) === false && page.searchParam.length > 0;
        }

        function clearDisplaySet() {
            page.lookup.displaySet = [];
            page.lookup.currentPage = 0;
            // $('.lookup-content').scrollTop(0);
        }

        function isSchoolDefined(school) {
            return _.isUndefined(school) === false && _.isNull(school) === false && _.isUndefined(school.domainName) === false;
        }
    }
})();
