(function() {
    'use strict';

    angular.module('app.services')
        .factory('UpdateService', ['$rootScope', '$timeout', 'DataService', 'StorageService', UpdateService])
    ;

    var UPDATE_INTERVAL = 10 * 60 * 1000; // 10 min

    function UpdateService($rootScope, $timeout, dataService, storageService) {
        var paused = false;
        var timer = null;

        $rootScope.$on('hardware.pause', function() {
            console.log("UpdateService: pause");
            paused = true;
            if(timer !== null) {
                $timeout.cancel(timer);
            }
        });

        $rootScope.$on('hardware.resume', function() {
            console.log("UpdateService: resume");
            paused = false;
            timer = $timeout(doUpdate, 5000);
        });

        function doUpdate() {
            if(paused === true) {
                return;
            }

            console.log("UpdateService: update -  " + new Date());

            if(storageService.isLoggedIn() === true) {
                dataService.update();
            }

            timer = $timeout(doUpdate, UPDATE_INTERVAL);
        }

        var service = {
            start: function() {
                console.log("Starting update service: " + new Date());
                timer = $timeout(doUpdate, UPDATE_INTERVAL);
            }
        };
        return service;
    }
})();
