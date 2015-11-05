(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('UnverifiedController', ['$scope', '$state', UnverifiedController])
        ;

        function UnverifiedController($scope, $state) {
            var unverified = this;

            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString("#5d8dc5");

            unverified.close = function() {
                $state.go('login');
            };

        }
})();
