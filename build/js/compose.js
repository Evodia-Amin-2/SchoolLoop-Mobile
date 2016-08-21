(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ComposeController', ['$scope', '$window', 'DataService', 'StorageService', 'gettextCatalog', ComposeController])
        ;

        function ComposeController($scope, $window, dataService, storageService, gettextCatalog) {
            var compose = this;

            compose.navigator = $scope.courseNavigator.topPage.pushedOptions.navigator;

            compose.back = function() {
                compose.navigator.popPage();
            };

            compose.send = function() {

            };
        }
})();
