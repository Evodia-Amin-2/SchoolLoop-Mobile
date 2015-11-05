(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('InvalidController', ['$scope', 'StatusService', InvalidController])
        ;

        function InvalidController($scope, statusService) {
            var invalid = this;

            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString("#5d8dc5");

            statusService.hideNoWait();
            navigator.splashscreen.hide();

            invalid.showButton = (device.platform.toLowerCase() === "android");

            invalid.close = function() {
                navigator.splashscreen.hide();
                navigator.app.exitApp();
            };

        }
})();
