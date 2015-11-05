(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('NotStartedController', ['$scope', '$state', NotStartedController])
        ;

        function NotStartedController($scope, $state) {
            var notStarted = this;

            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString("#5d8dc5");

            notStarted.close = function() {
                $state.go('login');
            };

        }
})();
