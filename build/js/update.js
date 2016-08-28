(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('UpdateController', ['StatusService', 'config', UpdateController])
        ;

        function UpdateController(statusService, config) {
            var update = this;

            StatusBar.backgroundColorByHexString("#009688");
            StatusBar.show();

            statusService.hideNoWait();
            navigator.splashscreen.hide();

            update.config = config;

            update.update = function() {
                window.chcp.installUpdate();
            };

        }
})();
