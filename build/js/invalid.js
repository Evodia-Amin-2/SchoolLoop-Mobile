(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('InvalidController', ['$location', 'StatusService', InvalidController])
        ;

        function InvalidController($location, statusService) {
            var invalid = this;

            statusService.hideNoWait();
            window.navigator.splashscreen.hide();

            invalid.close = function() {
                $location.path('/login');
                window.navigator.splashscreen.hide();
            };

        }
})();
