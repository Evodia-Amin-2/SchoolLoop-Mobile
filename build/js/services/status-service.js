(function() {
    'use strict';

    angular.module('app.services')
        .factory('StatusService', ['$timeout', 'gettextCatalog', StatusService])
    ;

    function StatusService($timeout, gettextCatalog) {

        var loginShowing = false;

        function show(message) {
            window.plugins.spinnerDialog.show(null, message, true);
        }

        var service = {
            showLoading: function() {
                show(gettextCatalog.getString("Loading..."));
            },
            showLogin: function() {
                if(loginShowing === false) {
                    loginShowing = true;
                    show(gettextCatalog.getString("Logging in..."));
                }
            },
            hideNoWait: function() {
                loginShowing = false;
                window.plugins.spinnerDialog.hide();
            },
            hideWait: function(delay) {
                loginShowing = false;
                $timeout(window.plugins.spinnerDialog.hide, delay);
            }
        };
        return service;
    }
})();
