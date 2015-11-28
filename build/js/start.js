(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('StartController', ['$state', '$timeout', 'StorageService', 'LoginService', 'DataService', 'StatusService', StartController])
    ;

    function StartController($state, $timeout, storageService, loginService, dataService, statusService) {
        var start = this;

        console.log("Starting application");

        StatusBar.overlaysWebView(true);
        StatusBar.styleLightContent();
        StatusBar.show();

        start.year = new Date().getFullYear();

        statusService.showLogin();

        if(storageService.isLoggedIn() === false) {
            $state.go('login');
            return;
        }
        var domain = storageService.getDefaultDomain();
        loginService.login(domain.school.domainName, domain.user.userName, domain.password).then(
            function(/* data */) {
                dataService.load().then(function() {
                    $state.go('main');
                }, function(response) {
                    var error = response.data;
                    if(error.startsWith("ERROR 6")) {
                        $state.go('notstarted');
                    } else if(error.startsWith("ERROR 6")) {
                        $state.go('reset');
                    }
                    $timeout(function() {
                        statusService.hideNoWait();
                        navigator.splashscreen.hide();
                        $state.go('login');
                    }, 750);
                });
            },
            function(error) {
                if (_.isString(error.data) && error.data.toLowerCase().startsWith("invalid version")) {
                    $state.go('invalid');
                    return;
                }
                $state.go('login');
            }
        );

    }

})();
