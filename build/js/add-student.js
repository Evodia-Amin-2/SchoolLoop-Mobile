(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AddStudentController', ['$rootScope', '$scope', 'StorageService', 'DataService', 'StatusService',
            'gettextCatalog', AddStudentController])
        .controller('ChangeSchoolController', ['$scope', '$timeout', 'LoginService', 'StorageService',
            'SchoolService', 'gettextCatalog', ChangeSchoolController])
    ;

    function AddStudentController($rootScope, $scope, storageService, dataService, statusService, gettextCatalog) {
        var page = this;

        var domain = storageService.getDefaultDomain();
        page.school = domain.school;

        page.students = [];

        page.placeholder = {};
        page.placeholder.studentId = gettextCatalog.getString("Student ID Number");
        page.placeholder.initialFirst = gettextCatalog.getString("First Letter of First Name");
        page.placeholder.initialLast = gettextCatalog.getString("First Letter of Last Name");

        page.studentId = "";
        page.initialFirst = "";
        page.initialLast = "";

        page.error = {};
        clearErrors();

        page.submitted = false;

        page.hasFieldError = function(field) {
            return (page.submitted === true && field.length === 0);
        };

        page.addStudent = function() {
            page.submitted = true;
            var student;
            var numStudents = page.students.length;
            if(numStudents > 0) {
                page.modalShowing = false;
                var school = page.school;
                student = page.students[0];
                storageService.addStudents(school, page.students, true);
                var message;
                if(numStudents > 2) {
                    message = gettextCatalog.getString("{name} and {number} others have been added");
                    message = message.replace("{name}", student.name);
                    message = message.replace("{number}", numStudents);
                } else if(numStudents === 2) {
                    message = gettextCatalog.getString("{name1} and {name2} have been added");
                    message = message.replace("{name1}", student.name[0]);
                    message = message.replace("{name2}", student.name[1]);
                } else {
                    message = gettextCatalog.getString("{name} has been added");
                    message = message.replace("{name}", student.name);
                }
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
                        message = gettextCatalog.getString("{name} has been added");
                        message = message.replace("{name}", student.name);
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
            $rootScope.$broadcast("refresh.modal");
            $scope.schoolModal.show();
            page.modalShowing = true;
        };

        page.cancel = function() {
            page.modalShowing = false;
            $scope.schoolModal.hide();
        };

        page.addSchool = function(school, userLogin, password) {
            $scope.schoolModal.hide();
            page.modalShowing = false;

            page.school = school;

            storageService.addDomain(school, userLogin, password);

            page.message = "";
            var students = userLogin.students;
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

    function ChangeSchoolController($scope, $timeout, loginService, storageService, schoolService, gettextCatalog) {
        var modal = this;

        var domain = storageService.getDefaultDomain();
        modal.username = domain.user.userName;
        modal.password = domain.user.hashedPassword;

        modal.selectedSchool = "";
        modal.searchParam = "";
        modal.authFailed = false;

        modal.placeholder = {};
        modal.placeholder.username = gettextCatalog.getString("User Name");
        modal.placeholder.password = gettextCatalog.getString("Password");
        modal.placeholder.school = gettextCatalog.getString("School Name");

        modal.error = {};
        clearErrors();

        modal.lookup = {};
        modal.lookup.expanded = false;
        modal.lookup.currentPage = 0;
        modal.lookup.itemsPerPage = 20;
        modal.lookup.displaySet = [];

        modal.schoolList = [];

        schoolService.list().then(
            function(data) {
                modal.schoolList = data;
            }
        );

        $scope.$on("refresh.modal", function() {
            modal.selectedSchool = "";
            modal.searchParam = "";
            modal.authFailed = false;
        });

        modal.isSchoolSelected = function () {
            return isSchoolDefined(modal.selectedSchool) === true;
        };

        modal.selectSchool = function(school) {
            if(isSchoolDefined(school) === true) {
                modal.selectedSchool = school;
                modal.searchParam = school.name;

                var $input = $(".lookup-input");
                $timeout(function() {
                    $input.blur();
                });
            } else {
                modal.selectedSchool = undefined;
                modal.searchParam = "";
                modal.submitted = false;
                modal.authFailed = false;
            }
            modal.lookup.expanded = false;
        };

        modal.expand = function() {
            clearDisplaySet();
            loadData();
            modal.lookup.expanded = true;
        };

        modal.clear = function() {
            modal.selectSchool();
            clearErrors();
        };

        modal.showClear = function() {
            return _.isUndefined(modal.selectedSchool) === false || isSearchDefined() || modal.lookup.expanded === true;
        };

        modal.change = function() {
            modal.lookup.expanded = (modal.searchParam && modal.searchParam.length > 0);
            clearDisplaySet();
            loadData();
        };

        function loadData() {
            if(_.isUndefined(modal.schoolList) === true) {
                return;
            }
            var start = modal.lookup.currentPage * modal.lookup.itemsPerPage;
            var end = start + modal.lookup.itemsPerPage;
            var results = modal.schoolList;
            var i, len, item, queryRegExp = null;
            if(isSearchDefined()) {
                results = [];
                queryRegExp = RegExp(modal.searchParam, 'i'); //'i' -> case insensitive
                for(i = start, len = modal.schoolList.length; i < len; i++) {
                    item = modal.schoolList[i];
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
                modal.lookup.displaySet.push(item);
            }
            if(modal.lookup.displaySet.length === 1) {
                modal.selectSchool(modal.lookup.displaySet[0]);
            } else if(modal.lookup.displaySet.length === 0) {
                modal.selectedSchool = "";
            }
        }

        modal.select = function() {
            if(_.isUndefined(modal.selectedSchool) === false) {
                clearErrors();
                var newSchool = modal.selectedSchool;
                loginService.login(newSchool.domainName, modal.username, modal.password).then(
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
            var data = response.data;
            if (data.isUnverifiedParent === 'true') {
                modal.message = gettextCatalog.getString("Parent needs to be verified");
            } else {
                $scope.page.addSchool(school, data, password);
            }
        }

        function processFailure(error) {
            var status = error.data;
            var isCredError = status.toLowerCase().startsWith("error 1:") ||
                status.toLowerCase().startsWith("error 2:");
            if(isCredError === true) {
                modal.authFailed = true;
                modal.password = "";
                modal.error.school =  gettextCatalog.getString("Invalid Login");
            }
            modal.message = "";
            console.log(error);
        }

        function isSearchDefined() {
            return _.isUndefined(modal.searchParam) === false && modal.searchParam.length > 0;
        }

        function clearDisplaySet() {
            modal.lookup.displaySet = [];
            modal.lookup.currentPage = 0;
            //$('.lookup-content').scrollTop(0);
        }

        function clearErrors() {
            modal.error.school = "";
            modal.error.username = "";
            modal.error.password = "";
        }

        function isSchoolDefined(school) {
            return _.isUndefined(school) === false && _.isNull(school) === false && _.isUndefined(school.domainName) === false;
        }
    }
})();
