(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ComposeController', ['$scope', ComposeController])
        ;

        function ComposeController($scope) {
            var compose = this;

            compose.back = function() {
                $scope.mainNavigator.popPage();
            };

            compose.send = function() {

            };
        }
})();
