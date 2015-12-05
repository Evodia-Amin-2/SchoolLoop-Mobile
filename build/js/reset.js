(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ResetController', ['$scope', '$state', 'DataService', 'StorageService', ResetController])
        ;

        function ResetController($scope, $state, dataService, storageService) {
            var reset = this;

            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString("#5d8dc5");

            reset.cancel = function() {
                goLogin();
            };

            reset.reset = function() {
                $scope.reset_form.$submitted = true;
                if($scope.reset_form.$valid) {
                    if(reset.password === reset.confirm) {
                        dataService.resetPassword(reset.password).then(
                            function() {
                                var domain = storageService.getDefaultDomain();
                                var domainName = domain.school.domainName;
                                storageService.setPassword(domainName, reset.password);
                                $state.go('main');
                            },
                            function() {
                                goLogin();
                            }
                        );
                    }
                }
            };

            function goLogin() {
                var domain = storageService.getDefaultDomain();
                var domainName = domain.school.domainName;
                storageService.clearPassword(domainName);
                $state.go('login');
            }

        }
})();
