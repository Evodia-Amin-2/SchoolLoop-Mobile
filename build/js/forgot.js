(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ForgotController', ['$scope', '$location', 'DataService', 'gettextCatalog', ForgotController])
        ;

        function ForgotController($scope, $location, dataService, gettextCatalog) {
            var page = this;
            page.inReset = false;

            page.email = "";
            page.submitted = false;

            page.placeholder = {};
            page.placeholder.email = gettextCatalog.getString("Login Name or Email");

            page.error = {};
            clearErrors();

            page.reset = function() {
                if(page.inReset === true) {
                    return;
                }
                page.inReset = true;
                page.submitted = true;
                if(isFormValid()) {
                    var params = {"email": page.email};
                    var title = gettextCatalog.getString("Forgot Password");
                    var message;
                    var button;
                    dataService.sendForgetEmail(params).then(
                        function() {
                            message = gettextCatalog.getString("Please check your email for your password and try to login again.  Thanks!");
                            button = gettextCatalog.getString("Login");
                            navigator.notification.alert(message, function() {
                                page.inReset = false;
                                $location.path("/login");
                            }, title, button);
                        },
                        function(response) {
                            var message;
                            if(response.data === "ERROR: err_external_user_forgot_msg") {
                                message = gettextCatalog.getString("Your username and password are managed by your school district. Please follow district protocol for resetting your password. In some cases, this can be done online. Visit your district website for more information.");
                            } else {
                                message = gettextCatalog.getString("Unable to send email to that address. Please try again!");
                            }
                            button = gettextCatalog.getString("Close");
                            navigator.notification.alert(message, function() {
                                $scope.$apply(function() {
                                    page.inReset = false;
                                    page.submitted = false;
                                    page.email = "";
                                    page.error.email = gettextCatalog.getString("Please enter email!");
                                });
                            }, title, button);
                            page.inReset = false;
                        }
                    );
                } else {
                    page.error.email = gettextCatalog.getString("Please enter email!");
                    page.inReset = false;
                }
            };

            page.cancel = function() {
                $location.path('/login');
            };

            page.hasFieldError = function(field) {
                return (page.submitted === true && field.length === 0);
            };

            function isFormValid() {
                clearErrors();
                return _.isUndefined(page.email) === false && page.email.length > 0;
            }

            function clearErrors() {
                page.error.email = "";
            }

        }
})();
