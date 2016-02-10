(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('SupportController', ['$scope', '$window', 'NavbarService', 'DataService', 'StorageService', 'gettextCatalog', SupportController])
        ;

        function SupportController($scope, $window, navbarService, dataService, storageService, gettextCatalog) {
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
                var error = false;
                if(_.isUndefined(support.email) || support.email.length === 0) {
                    $scope.ticket.submitted = true;
                    $scope.ticket.email.$invalid = true;
                    support.emailError = gettextCatalog.getString("Email required");
                    error = true;
                }
                if(_.isUndefined(support.subject) || support.subject.length === 0) {
                    $scope.ticket.submitted = true;
                    $scope.ticket.subject.$invalid = true;
                    support.subjectError = gettextCatalog.getString("Subject required");
                    error = true;
                }
                if(error === false) {
                    var message;
                    dataService.supportTicket(support.name, support.subject, support.details, support.email, support.cc).then(
                        function() {
                            message = gettextCatalog.getString("Help ticket has been submitted");
                            window.plugins.toast.showLongBottom(message, function() {
                                $window.history.back();
                            });
                        },
                        function() {
                            message = gettextCatalog.getString("There was a problem sending the help ticket");
                            window.plugins.toast.showLongBottom(message, function() {
                                $window.history.back();
                            });
                        }

                    );
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
