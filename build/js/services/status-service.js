(function() {
    'use strict';

    angular.module('app.services')
        .factory('StatusService', ['$timeout', '$location', 'StorageService', 'gettextCatalog', StatusService])
    ;

    function StatusService($timeout, $location, storageService, gettextCatalog) {

        var loginShowing = false;

        function show(message) {
            window.plugins.spinnerDialog.show(null, message, true);
        }

        var service = {
            showLoading: function() {
                show(gettextCatalog.getString("Loading..."));
            },
            showMessage: function(message) {
                show(message);
            },
            showLogin: function() {
                if(loginShowing === false) {
                    loginShowing = true;
                    show(gettextCatalog.getString("Logging in..."));

                    $timeout(function() {
                        if(loginShowing === true) {
                            loginShowing = false;
                            window.plugins.spinnerDialog.hide();
                            storageService.clearOnce();
                            $location.path('/login');
                        }
                    }, 30000);
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
