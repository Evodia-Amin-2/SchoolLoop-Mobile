(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ResetController', ['$scope', '$state', 'DataService', 'StorageService', 'gettextCatalog', ResetController])
        ;

        function ResetController($scope, $state, dataService, storageService, gettextCatalog) {
            var reset = this;
            reset.inReset = false;

            var messages = {
                "ERROR: error_password_has_space": gettextCatalog.getString("Spaces are not allowed"),
                "ERROR: error_password_must_have_digit": gettextCatalog.getString("You must include at least one digit"),
                "ERROR: error_password_to_short": gettextCatalog.getString("Passwords must be at least 6 characters"),
                "ERROR: error_passwords_must_match": gettextCatalog.getString("Passwords do not match")
            };

            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString("#5d8dc5");

            reset.cancel = function() {
                goLogin();
            };

            reset.reset = function() {
                if(reset.inReset === true) {
                    return;
                }
                reset.inReset = true;
                $scope.reset_form.submitted = true;
                if($scope.reset_form.$valid) {
                    if(reset.password === reset.confirm) {
                        dataService.resetPassword(reset.password).then(
                            function(response) {
                                var data = response.data;
                                if(_.isString(data) && data.startsWith("ERROR")) {
                                    reset.password = undefined;
                                    reset.confirm = undefined;
                                    if(data === "ERROR: err_external_user_forgot_msg") {
                                        var title = gettextCatalog.getString("Info");
                                        var message = gettextCatalog.getString("Your username and password are managed by your school district. Please follow district protocol for resetting your password. In some cases, this can be done online. Visit your district website for more information.");
                                        var button = gettextCatalog.getString("Cancel");
                                        navigator.notification.alert(message, function() {
                                            goLogin();
                                        }, title, button);
                                    } else {
                                        $scope.reset_form.password.placeholder = messages[data];
                                        $scope.reset_form.password.$invalid = true;
                                        reset.inReset = false;
                                    }
                                } else {
                                    var school = storageService.getSelectedSchool();
                                    storageService.addDomain(school, data, reset.password);
                                    storageService.addStudents(school, data.students, true);
                                    reset.inReset = false;
                                    $state.go('main');
                                }
                            },
                            function(error) {
                                console.log(error);
                                goLogin();
                            }
                        );
                    } else {
                        reset.confirm = undefined;
                        $scope.reset_form.confirm.$invalid = true;
                        $scope.reset_form.confirm.placeholder = gettextCatalog.getString("Passwords don't match");
                        reset.inReset = false;
                    }
                } else {
                    if(_.isUndefined(reset.password) === true) {
                        $scope.reset_form.password.$invalid = true;
                        $scope.reset_form.password.placeholder = gettextCatalog.getString("Password Required!");
                    }
                    if(_.isUndefined(reset.confirm) === true) {
                        $scope.reset_form.confirm.$invalid = true;
                        $scope.reset_form.confirm.placeholder = gettextCatalog.getString("Password Required!");
                    }
                    reset.inReset = false;
                }
            };

            function goLogin() {
                reset.inReset = false;
                var domain = storageService.getDefaultDomain();
                var domainName = domain.school.domainName;
                storageService.clearPassword(domainName);
                $state.go('login');
            }

        }
})();
