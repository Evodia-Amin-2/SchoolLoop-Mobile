(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('UpdateController', ['StatusService', UpdateController])
        ;

        function UpdateController(statusService) {
            var update = this;

            StatusBar.backgroundColorByHexString("#009688");
            StatusBar.show();

            statusService.hideNoWait();
            navigator.splashscreen.hide();

            update.update = function() {
                window.chcp.installUpdate();
            };

        }
})();
