(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ResetController', ['$location', 'StorageService', 'DataService', 'gettextCatalog', ResetController])
    ;

    function ResetController($location, storageService, dataService, gettextCatalog) {
        var page = this;

        page.placeholder = {};
        page.placeholder.password = gettextCatalog.getString("New Password");
        page.placeholder.confirm = gettextCatalog.getString("Confirm Password");

        page.password = "";
        page.confirm = "";

        page.error = {};
        clearErrors();

        page.submitted = false;

        var messages = {
            "ERROR: error_password_has_space": gettextCatalog.getString("Spaces are not allowed"),
            "ERROR: error_password_must_have_digit": gettextCatalog.getString("You must include at least one digit"),
            "ERROR: error_password_to_short": gettextCatalog.getString("Passwords must be at least 6 characters"),
            "ERROR: error_passwords_must_match": gettextCatalog.getString("Passwords do not match")
        };

        page.cancel = function() {
            goLogin();
        };

        page.reset = function() {
            page.submitted = true;

            if(isFormValid()) {
                if(page.password === page.confirm) {
                    dataService.resetPassword(page.password).then(
                        function(response) {
                            var data = response.data;
                            if(_.isString(data) && data.startsWith("ERROR")) {
                                page.password = "";
                                page.confirm = "";
                                if(data === "ERROR: err_external_user_forgot_msg") {
                                    var title = gettextCatalog.getString("Info");
                                    var message = gettextCatalog.getString("Your username and password are managed by your school district. Please follow district protocol for resetting your password. In some cases, this can be done online. Visit your district website for more information.");
                                    var button = gettextCatalog.getString("Cancel");
                                    navigator.notification.alert(message, function() {
                                        goLogin();
                                    }, title, button);
                                } else {
                                    page.error.password = messages[data];
                                }
                            } else {
                                var school = storageService.getSelectedSchool();
                                storageService.addDomain(school, data, page.password);
                                storageService.addStudents(school, data.students, true);
                                $location.go('/main');
                            }
                        },
                        function(error) {
                            console.log(error);
                            goLogin();
                        }
                    );
                } else {
                    page.confirm = "";
                    page.error.confirm = gettextCatalog.getString("Passwords don't match");
                }

            } else {
                if(page.password.length === 0) {
                    page.error.password = gettextCatalog.getString("Password Required!");
                }
                if(page.confirm.length === 0) {
                    page.error.confirm = gettextCatalog.getString("Password Required!");
                }
            }
        };

        page.hasFieldError = function(field) {
            return (page.submitted === true && field.length === 0);
        };

        function isFormValid() {
            clearErrors();
            return page.password.length > 0 && page.confirm.length > 0;
        }

        function clearErrors() {
            page.error.password = "";
            page.error.confirm = "";
        }

        function goLogin() {
            var domain = storageService.getDefaultDomain();
            var domainName = domain.school.domainName;
            storageService.clearPassword(domainName);
            $location.path('/login');
        }
    }
})();
