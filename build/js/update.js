(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('UpdateController', ['StatusService', 'Utils', '$http', 'config', UpdateController])
        ;

        function UpdateController(statusService, utils, $http, config) {
            var page = this;

            page.updating = false;

            page.changeList = [];

            utils.setStatusBar("#009688");

            statusService.hideNoWait();
            navigator.splashscreen.hide();

            var platform = "android";
            if (ons.platform.isIOS()) {
                platform = "ios";
            }

            page.config = config;
            var endpoint = "https://s3-us-west-2.amazonaws.com/schoolloop-release/" +
                page.config.id + "/changes-" + platform + ".json?" + new Date();
            $http({
                method: "GET",
                url: endpoint,
                headers: {
                    "Authorization": undefined
                }
            }).then(
                function(response) {
                    page.data = response.data;
                    page.changeList = response.data.changes;
                }
            );

            page.update = function() {
                page.updating = true;
                window.chcp.installUpdate();
            };

        }
})();
