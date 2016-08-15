(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('InvalidController', ['StatusService', InvalidController])
        ;

        function InvalidController(statusService) {
            var invalid = this;

            statusService.hideNoWait();
            navigator.splashscreen.hide();

            invalid.close = function() {
                navigator.splashscreen.hide();
                navigator.app.exitApp();
            };

        }
})();
