(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('UpdateController', ['StatusService', 'config', UpdateController])
        ;

        function UpdateController(statusService, config) {
            var page = this;

            page.updating = false;

            StatusBar.backgroundColorByHexString("#009688");
            StatusBar.show();

            statusService.hideNoWait();
            navigator.splashscreen.hide();

            page.config = config;

            page.update = function() {
                page.updating = true;
                window.chcp.installUpdate();
            };

        }
})();
