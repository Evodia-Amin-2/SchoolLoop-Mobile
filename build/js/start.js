(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('StartController', ['$location', '$timeout', 'StorageService', 'LoginService', 'DataService', 'StatusService', StartController])
    ;

    function StartController($location, $timeout, storageService, loginService, dataService, statusService) {
        var start = this;

        console.log("Starting application");

        StatusBar.overlaysWebView(true);
        StatusBar.styleDefault();
        StatusBar.show();

        start.year = new Date().getFullYear();

        statusService.showLogin();

        var school = storageService.getSchool();
        if(_.isUndefined(school) === true) {
            $location.path('/login');
            return;
        }

        if(storageService.isLoggedIn() === false) {
            $location.path('/login');
            return;
        }
        console.log("Attempting to automatically login");

        loginService.login().then(
            function(message) {
                var data = message.data;
                storageService.addStudents(school, data.students, true);
                dataService.load().then(function() {
                    $location.path('/main');
                }, function(response) {
                    var error = response.data;
                    if(error.toLowerCase().startsWith("error 6")) {
                        $location.path('/notstarted');
                    }
                });
            },
            function(error) {
                if (_.isString(error.data) && error.data.toLowerCase().startsWith("invalid version")) {
                    $location.path('/invalid');
                    return;
                }
                $location.path('/login');
            }
        );

    }

})();
