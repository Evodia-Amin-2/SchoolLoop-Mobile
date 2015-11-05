(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ForgotController', ['$scope', '$state', 'DataService', 'gettextCatalog', ForgotController])
        ;

        function ForgotController($scope, $state, dataService, gettextCatalog) {
            var forgot = this;

            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString("#5d8dc5");

            forgot.cancel = function() {
                $state.go('login');
            };

            forgot.reset = function() {
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
                                $state.go("login");
                            }, title, button);
                        },
                        function() {
                            message = gettextCatalog.getString("Unable to send email to that address. Please try again!");
                            button = gettextCatalog.getString("Close");
                            navigator.notification.alert(message, function() {}, title, button);
                            forgot.email = "";
                            forgot.placeholder = gettextCatalog.getString("Please enter email!");
                        }
                    );
                } else {
                    forgot.placeholder = gettextCatalog.getString("Please enter email!");
                }
            };

        }
})();
