(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AgreementCtrl', ['$state', 'StatusService', 'DataService', 'StorageService', AgreementCtrl])
    ;

    function AgreementCtrl($state, statusService, dataService, storageService) {

        var agreement = this;

        StatusBar.styleDefault();
        StatusBar.backgroundColorByHexString("#5d8dc5");

        statusService.hideNoWait();
        navigator.splashscreen.hide();

        agreement.accept = function () {
            dataService.accept().then(
                function() {
                    $state.go('main');
                }
            );
        };

        agreement.decline = function () {
            var domain = storageService.getDefaultDomain();
            storageService.clearPassword(domain.school.domainName);
            $state.go('login');
        };
    }
})();
