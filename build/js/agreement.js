(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AgreementCtrl', ['$location', 'StatusService', 'DataService', 'StorageService', AgreementCtrl])
    ;

    function AgreementCtrl($location, statusService, dataService, storageService) {

        var agreement = this;

        statusService.hideNoWait();
        navigator.splashscreen.hide();

        agreement.accept = function () {
            dataService.accept().then(
                function() {
                    $location.path('/main');
                }
            );
        };

        agreement.decline = function () {
            var domain = storageService.getDefaultDomain();
            storageService.clearPassword(domain.school.domainName);
            $location.path('/login');
        };
    }
})();
