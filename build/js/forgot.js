(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ForgotController', ['$scope', '$state', 'DataService', 'gettextCatalog', ForgotController])
        ;

        function ForgotController($scope, $state, dataService, gettextCatalog) {
            var forgot = this;
            forgot.inReset = false;

            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString("#5d8dc5");

            forgot.cancel = function() {
                $state.go('login');
            };

            forgot.reset = function() {
                if(forgot.inReset === true) {
                    return;
                }
                forgot.inReset = true;
                $scope.forgot_form.$submitted = true;
                if($scope.forgot_form.$valid) {
                    var params = {"email": forgot.email};
                    var title = gettextCatalog.getString("Forgot Password");
                    var message;
                    var button;
                    dataService.sendForgetEmail(params).then(
                        function() {
                            message = gettextCatalog.getString("Please check your email for your password and try to login again.  Thanks!");
                            button = gettextCatalog.getString("Login");
                            navigator.notification.alert(message, function() {
                                forgot.inReset = false;
                                $state.go("login");
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
                                    forgot.inReset = false;
                                    $scope.forgot_form.$submitted = false;
                                    forgot.email = "";
                                    forgot.placeholder = gettextCatalog.getString("Please enter email!");
                                });
                            }, title, button);
                        }
                    );
                } else {
                    forgot.placeholder = gettextCatalog.getString("Please enter email!");
                    forgot.inReset = false;
                }
            };

        }
})();
