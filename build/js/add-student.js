(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AddStudentController', ['$rootScope', '$scope', '$timeout', 'LoginService', 'StorageService', 'DataService', 'StatusService',
            'SchoolService', 'gettextCatalog', AddStudentController])
    ;

    function AddStudentController($rootScope, $scope, $timeout, loginService, storageService, dataService, statusService,
            schoolService, gettextCatalog) {
        var page = this;

        var domain = storageService.getDefaultDomain();
        page.school = domain.school;

        page.studentId = "";
        page.initialFirst = "";
        page.initialLast = "";
        page.students = [];

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
                page.selectedSchool = school;
                page.searchParam = school.name;

                var $button = $(".login-button");
                $timeout(function() {
                    $button.focus();
                });
            } else {
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
            var student;
            if(page.students.length > 0) {
                var school = page.selectedSchool;
                student = page.students[0];
                storageService.addStudents(school, page.students, true);
                var message = gettextCatalog.getString("{} has been added");
                message = message.replace("{}", student.name);
                $scope.mainNavigator.popPage();

                storageService.setSelectedStudentId(student.studentID);

                window.plugins.toast.showLongBottom(message);

                dataService.clearCache();
                dataService.load().then(function() {
                    $rootScope.$broadcast("refresh.students");
                });
                return;
            }
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
                        student = response[0];
                        var message = gettextCatalog.getString("{} has been added");
                        message = message.replace("{}", student.name);
                        $scope.mainNavigator.popPage();

                        storageService.setSelectedStudentId(student.studentID);

                        window.plugins.toast.showLongBottom(message);

                        dataService.clearCache();
                        dataService.load().then(function() {
                            $rootScope.$broadcast("refresh.students");
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
            $timeout(function() {
                var lookup = $('#school-lookup');
                var input = lookup.find('input');
                input.attr('placeholder', page.error.school);
                input.focus();
            }, 200);
        };

        page.cancel = function() {
            page.selectSchool();
            $scope.schoolModal.hide();
        };

        page.select = function() {
            if(_.isUndefined(page.selectedSchool) === false) {
                var newSchool = page.selectedSchool;
                loginService.login(newSchool.domainName, domain.user.userName, domain.user.hashedPassword).then(
                    function(response) {
                        processSuccess(response, newSchool, domain.user.hashedPassword);
                    },
                    function(error) {
                        processFailure(error);
                    }
                );
            }
        };

        function processSuccess(response, school, password) {
            $scope.schoolModal.hide();
            page.school = school;
            var data = response.data;
            if (data.isUnverifiedParent === 'true') {
                page.message = gettextCatalog.getString("Parent needs to be verified");
            } else {
                storageService.addDomain(school, data, password);
                page.message = "";
                var students = data.students;
                page.students = [];
                page.existing = [];
                if (_.isUndefined(students) === false && _.isNull(students) === false) {
                    var currentStudents = storageService.getStudents();
                    for (var i = 0, len = students.length; i < len; i++) {
                        var student = students[i];
                        var result = _.findWhere(currentStudents, {studentID: student.studentID});
                        if (_.isUndefined(result) === true) {
                            page.students.push(student);
                        } else {
                            page.existing.push(student);
                        }
                    }
                }
            }
        }

        function processFailure(/*error*/) {
            // adder.loginSuccess = false;
            // adder.message = "";
            // adder.password = "";
            // console.log(error);
        }

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
