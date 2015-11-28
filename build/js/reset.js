(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ResetController', ['$scope', '$state', 'DataService', 'gettextCatalog', ResetController])
        ;

        function ResetController($scope, $state, dataService, gettextCatalog) {
            var reset = this;

            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString("#5d8dc5");

            reset.cancel = function() {
                $state.go('login');
            };

            reset.reset = function() {
                $scope.reset_form.$submitted = true;
                if($scope.reset_form.$valid) {
                    var params = {"email": reset.email};
                    var title = gettextCatalog.getString("Reset Password");
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
                            reset.email = "";
                            reset.placeholder = gettextCatalog.getString("Please enter email!");
                        }
                    );
                } else {
                    reset.placeholder = gettextCatalog.getString("Please enter email!");
                }
            };

        }
})();
