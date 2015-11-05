(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AddStudentController', ['$rootScope', '$scope', '$window', '$timeout', 'NavbarService', 'SchoolService',
            'StatusService', 'LoginService', 'StorageService', 'DataService', 'gettextCatalog', AddStudentController])
    ;

    function AddStudentController($rootScope, $scope, $window, $timeout, navbarService, schoolService,
                                  statusService, loginService, storageService, dataService, gettextCatalog) {
        var adder = this;

        var domain = storageService.getDefaultDomain();

        adder.school = domain.school;
        adder.selectedSchool = [];
        adder.loginSuccess = true;
        $scope.students = [];
        $scope.existing = [];

        //$timeout(function() {
            // because of the transclusion on the scroll directive
            // need to get the forms this way
            //$scope.add_student = $scope.$$childHead.$$childHead.add_student;
            //$scope.login_form = $scope.$$childHead.$$childHead.login_form;
        //});

        navbarService.reset();
        navbarService.setTitle(gettextCatalog.getString("Add Student"));
        navbarService.setEditMode(true);
        navbarService.setDoneEnabled(true);

        adder.schoolLookup = {
            load: function(lookup) {
                schoolService.list().then(
                    function(data) {
                        lookup.data = data;
                    }
                );
            }
        };

        adder.isSchoolSelected = function() {
            var selected = adder.selectedSchool;
            return selected.length > 0 && _.isUndefined(selected[0]) === false;
        };

        adder.add = function () {
            var school = adder.selectedSchool[0];
            storageService.addStudents(school, adder.students, true);
            adder.existing = adder.students;
            $rootScope.$broadcast('students.refresh');
        };

        console.log("Adding student handler " + new Date());

        adder.addStudent = function () {
            adder.addSubmitted = true;
            console.log("add: " + adder.addSubmitted);
            if($scope.add_student.$valid) {
                var params = {};
                params.studentID = adder.studentID;
                params.firstLetter = adder.firstLetter;
                params.lastLetter = adder.lastLetter;
                params.url = adder.school.domainName;

                statusService.showLoading();

                dataService.addStudent(params).then(
                    function(response) {
                        adder.addedStudent = response[0];
                        storageService.addStudents(adder.school, response, false);
                        $rootScope.$broadcast('students.refresh');
                        statusService.hideWait(500);
                    },
                    function(error) {
                        statusService.hideWait(500);
                        window.plugins.toast.showLongBottom(error.data);
                        adder.studentID = undefined;
                        $scope.add_student.studentID.placeholder = gettextCatalog.getString("Required");
                    }
                );
            } else {
                $scope.add_student.studentID.placeholder = gettextCatalog.getString("Required");
                $scope.add_student.firstLetter.placeholder = gettextCatalog.getString("Required");
                $scope.add_student.lastLetter.placeholder = gettextCatalog.getString("Required");
            }
        };

        $timeout(function() {
            $rootScope.$broadcast("scroll.refresh");
        }, 200);

        adder.retry = function () {
            if($scope.login_form.$valid) {
                var school = adder.selectedSchool[0];
                adder.message = gettextCatalog.getString("Fetching students...");
                loginService.login(school.domainName, adder.username, adder.password).then(
                    function(response) {
                        processSuccess(response, school, adder.password);
                    },
                    function(error) {
                        processFailure(error);
                        $scope.login_form.submitted = true;
                        $scope.login_form.password.$invalid = true;
                        $scope.login_form.password.placeholder = gettextCatalog.getString("Login Incorrect!");
                    }
                );
            } else {
                $scope.login_form.submitted = true;
                $scope.login_form.username.placeholder = gettextCatalog.getString("Login Name Required!");
                $scope.login_form.password.placeholder = gettextCatalog.getString("Password Required!");
            }
        };

        adder.register = function () {
            var school = adder.selectedSchool[0];
            var url = "http://" + school.domainName + "/mobile/app_register_parent";
            $window.open(url, '_blank', 'location=yes');
        };

        adder.resetAdd = function () {
            adder.addSubmitted = false;
            $scope.add_student.$dirty = false;
            $scope.add_student.$pristine = true;
            adder.addedStudent = undefined;
            adder.studentID = undefined;
            adder.firstLetter = undefined;
            adder.lastLetter = undefined;
        };

        $scope.$watch('adder.selectedSchool', function(newValue, oldValue) {
            if(newValue && newValue !== oldValue) {
                var newSchool = newValue[0];
                if(_.isUndefined(newSchool) === false) {
                    adder.school = newSchool;
                    adder.message = gettextCatalog.getString("Fetching students...");
                    loginService.login(newSchool.domainName, domain.user.userName, domain.password).then(
                        function(response) {
                            processSuccess(response, newSchool, domain.password);
                        },
                        function(error) {
                            processFailure(error);
                        }
                    );
                }
            }
        }, true);

        function processSuccess(response, school, password) {
            adder.loginSuccess = true;
            var data = response.data;
            if (data.isUnverifiedParent === 'true') {
                adder.message = gettextCatalog.getString("Parent needs to be verified");
            } else {
                storageService.addDomain(school, data, password);

                adder.message = "";

                var students = data.students;
                adder.students = [];
                adder.existing = [];
                if (_.isUndefined(students) === false && _.isNull(students) === false) {
                    var currentStudents = storageService.getStudents();
                    for (var i = 0, len = students.length; i < len; i++) {
                        var student = students[i];
                        var result = _.findWhere(currentStudents, {studentID: student.studentID});
                        if (_.isUndefined(result) === true) {
                            adder.students.push(student);
                        } else {
                            adder.existing.push(student);
                        }
                    }
                }
            }
        }

        function processFailure(error) {
            adder.loginSuccess = false;
            adder.message = "";
            adder.password = "";
            console.log(error);
        }

        $scope.$on("menu.back", function() {
            $window.history.back();
        });

        $scope.$on("menu.done", function() {
            $window.history.back();
        });

        $scope.$on("menu.cancel", function() {
            $window.history.back();
        });
    }
})();
