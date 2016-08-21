(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('HelpController', ['$scope', '$window', 'DataService', 'StorageService', 'gettextCatalog', HelpController])
        ;

        function HelpController($scope, $window, dataService, storageService, gettextCatalog) {
            var help = this;

            var domain = storageService.getDefaultDomain();
            var user = domain.user;
            help.user = user;
            help.name = user.fullName;
            help.email = user.email;
            help.cc = "";
            help.subject = "";
            help.details = "";

            $scope.$on("menu.send", function() {
                var error = false;
                if(_.isUndefined(help.email) || help.email.length === 0) {
                    $scope.ticket.submitted = true;
                    $scope.ticket.email.$invalid = true;
                    help.emailError = gettextCatalog.getString("Email required");
                    error = true;
                }
                if(_.isUndefined(help.subject) || help.subject.length === 0) {
                    $scope.ticket.submitted = true;
                    $scope.ticket.subject.$invalid = true;
                    help.subjectError = gettextCatalog.getString("Subject required");
                    error = true;
                }
                if(error === false) {
                    var message;
                    dataService.supportTicket(help.name, help.subject, help.details, help.email, help.cc).then(
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
