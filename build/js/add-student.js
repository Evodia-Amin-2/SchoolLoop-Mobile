(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AddStudentController', ['$rootScope', '$scope', 'StorageService', 'DataService', 'StatusService', 'gettextCatalog', AddStudentController])
    ;

    function AddStudentController($rootScope, $scope, storageService, dataService, statusService, gettextCatalog) {
        var page = this;

        var domain = storageService.getDefaultDomain();
        page.school = domain.school;

        page.studentId = "";
        page.initialFirst = "";
        page.initialLast = "";

        page.placeholder = {};
        page.placeholder.studentId = gettextCatalog.getString("Student ID Number");
        page.placeholder.initialFirst = gettextCatalog.getString("First Letter of First Name");
        page.placeholder.initialLast = gettextCatalog.getString("First Letter of Last Name");

        page.error = {};
        clearErrors();

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
                        page.studentId = undefined;
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
