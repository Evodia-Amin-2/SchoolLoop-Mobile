(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ComposeController', ['$scope', '$window', 'DataService', 'StorageService', 'gettextCatalog', ComposeController])
        ;

        function ComposeController($scope, $window, dataService, storageService, gettextCatalog) {
            var compose = this;

            compose.back = function() {
                $scope.mainNavigator.popPage();
            };

            compose.send = function() {

            };
        }
})();
