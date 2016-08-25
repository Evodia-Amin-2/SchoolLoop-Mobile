(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AddStudentController', ['$rootScope', '$scope', 'StorageService', 'DataService', 'StatusService',
            'SchoolService', 'gettextCatalog', AddStudentController])
    ;

    function AddStudentController($rootScope, $scope, storageService, dataService, statusService,
            schoolService, gettextCatalog) {
        var page = this;

        var domain = storageService.getDefaultDomain();
        page.school = domain.school;

        page.studentId = "";
        page.initialFirst = "";
        page.initialLast = "";

        page.selectedSchool = undefined;
        page.searchParam = undefined;

        page.placeholder = {};
        page.placeholder.school = gettextCatalog.getString("School Name");
        page.placeholder.studentId = gettextCatalog.getString("Student ID Number");
        page.placeholder.initialFirst = gettextCatalog.getString("First Letter of First Name");
        page.placeholder.initialLast = gettextCatalog.getString("First Letter of Last Name");

        page.lookup = {};
        page.lookup.expanded = false;
        page.lookup.currentPage = 0;
        page.lookup.itemsPerPage = 20;
        page.lookup.displaySet = [];

        page.error = {};
        clearErrors();

        schoolService.list().then(
            function(data) {
                page.schoolList = data;
            }
        );

        page.selectSchool = function(school) {
            clearErrors();

            if(isSchoolDefined(school) === true) {
                // storageService.setSchool(school);
                page.selectedSchool = school;
                page.searchParam = school.name;

                // var $username = $("#username");
                // var $input = $username.find(":input");
                // $timeout(function() {
                //     $input.focus();
                // });
            } else {
                // storageService.clear();
                page.selectedSchool = undefined;
                page.searchParam = "";
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

        page.isSchoolSelected = function () {
            return isSchoolDefined(page.selectedSchool) === true;
        };

        function isSchoolDefined(school) {
            return _.isUndefined(school) === false && _.isNull(school) === false && _.isUndefined(school.domainName) === false;
        }

        page.submitted = false;

        page.hasFieldError = function(field) {
            return (page.submitted === true && field.length === 0);
        };

        page.addStudent = function() {
            page.submitted = true;
            if(isFormValid()) {
                var params = {};
                params.studentID = page.studentId;
                params.firstLetter = page.initialFirst;
                params.lastLetter = page.initialLast;
                params.url = page.school.domainName;

                statusService.showLoading();

                dataService.addStudent(params).then(
                    function(response) {
                        storageService.addStudents(page.school, response, false);
                        statusService.hideNoWait();
                        var student = response[0];
                        var message = gettextCatalog.getString("{} has been added");
                        message = message.replace("{}", student.name);
                        $scope.mainNavigator.popPage();

                        storageService.setSelectedStudentId(student.studentID);

                        window.plugins.toast.showLongBottom(message);

                        dataService.clearCache();
                        dataService.load().then(function() {
                            $rootScope.$broadcast("refresh.all");
                        });

                    },
                    function(error) {
                        statusService.hideWait(500);
                        window.plugins.toast.showLongBottom(error.data);
                        page.studentId = "";
                        page.initialFirst = "";
                        page.initialLast = "";
                        page.error.studentId = gettextCatalog.getString("Student not found");
                    }
                );

            } else {
                if(page.studentId.length === 0) {
                    page.error.studentId = gettextCatalog.getString("Student Id Required!");
                }
                if(page.initialFirst.length === 0) {
                    page.error.initialFirst = gettextCatalog.getString("First Letter of First Name Required!");
                }
                if(page.initialLast.length === 0) {
                    page.error.initialLast = gettextCatalog.getString("First Letter of Last Name Required!");
                }
            }
        };

        page.changeSchool = function() {
            $scope.schoolModal.show();
        };

        page.cancel = function() {
            page.selectSchool();
            $scope.schoolModal.hide();
        };

        page.select = function() {
            $scope.schoolModal.hide();
        };

        function isFormValid() {
            clearErrors();
            return page.studentId.length > 0 && page.initialFirst.length === 1 && page.initialLast.length === 1;
        }

        function clearErrors() {
            page.error.studentId = "";
            page.error.initialFirst = "";
            page.error.initialLast = "";
        }

    }
})();
