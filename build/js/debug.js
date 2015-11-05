(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('DebugController', ['$state', '$window', 'DataService', 'config', DebugController])
        ;

        function DebugController($state, $window, dataService, config) {
            var debug = this;

            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString("#5d8dc5");

            debug.device = device;
            debug.config = config;
            debug.data = dataService.cache();

            debug.storage = [];
            var localStorage = $window.localStorage;
            for(var i = 0, len = localStorage.length; i < len; i++) {
                var key = localStorage.key(i);
                var item = localStorage.getItem(key);
                if(item.startsWith("[") || item.startsWith("{")) {
                    item = JSON.parse(item);
                }
                debug.storage.push({"key": key, "value": item});
            }

            debug.login = function() {
                $state.go('login');
            };

            debug.done = function() {
                $state.go('main');
            };

        }
})();
