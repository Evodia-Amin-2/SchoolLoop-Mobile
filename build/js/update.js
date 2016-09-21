(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('UpdateController', ['StatusService', 'Utils', 'config', UpdateController])
        ;

        function UpdateController(statusService, utils, config) {
            var page = this;

            page.updating = false;

            utils.setStatusBar("#009688");

            statusService.hideNoWait();
            navigator.splashscreen.hide();

            page.config = config;

            page.update = function() {
                page.updating = true;
                window.chcp.installUpdate();
            };

        }
})();
