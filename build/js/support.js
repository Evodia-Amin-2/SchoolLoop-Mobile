(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('SupportController', ['$scope', '$window', 'NavbarService', 'DataService', 'LoopmailService', 'StorageService', '$stateParams', 'gettextCatalog', SupportController])
        ;

        function SupportController($scope, $window, navbarService, dataService, loopmailService, storageService, $stateParams, gettextCatalog) {
            var support = this;

            navbarService.reset();
            navbarService.setEditMode(true);
            navbarService.setSendEnabled(true);
            navbarService.setTitle(gettextCatalog.getString("Help"));

            var domain = storageService.getDefaultDomain();
            var user = domain.user;
            support.user = user;
            support.name = user.fullName;
            support.email = user.email;
            support.cc = "";
            support.subject = "";
            support.details = "";

            $scope.$on("menu.send", function() {
                if(_.isUndefined(support.subject) || support.subject.length === 0) {
                    $scope.ticket.submitted = true;
                    $scope.ticket.subject.$invalid = true;
                    support.subjectError = gettextCatalog.getString("Subject required");
                } else {
                    alert("Send support ticket");
                    //loopmailService.send(support.toList, support.ccList, support.subject, support.body);
                }
            });

            $scope.$on("menu.cancel", function() {
                $window.history.back();
            });

            $scope.$on("menu.back", function() {
                $window.history.back();
            });
        }
})();
