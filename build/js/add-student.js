(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AddStudentController', ['$rootScope', '$scope', 'StorageService', 'DataService', 'StatusService',
            'gettextCatalog', AddStudentController])
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
                var school = page.school;
                student = page.students[0];
                storageService.addStudents(school, page.students, true);
                var message;
                if(numStudents > 2) {
                    message = gettextCatalog.getString("{name} and {number} others have been added");
                    message = message.replace("{name}", student.name);
                    message = message.replace("{number}", (numStudents - 1);
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
            $scope.mainNavigator.pushPage("change-school.html", {animation: 'slide', addCallback: page.addSchool});
        };

        page.addSchool = function(school, userLogin, password) {
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
})();
