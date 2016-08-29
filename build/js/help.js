(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('HelpController', ['$scope', '$window', 'DataService', 'StorageService', 'gettextCatalog', HelpController])
    ;

    function HelpController($scope, $window, dataService, storageService, gettextCatalog) {
        var page = this;

        var domain = storageService.getDefaultDomain();
        var user = domain.user;
        page.user = user;
        page.name = user.fullName;
        page.email = user.email;
        page.cc = "";
        page.subject = "";
        page.details = "";

        page.placeholder = {};
        page.placeholder.email = gettextCatalog.getString("Your Email Address:");
        page.placeholder.cc = gettextCatalog.getString("CC");
        page.placeholder.subject = gettextCatalog.getString("Subject");
        page.placeholder.details = gettextCatalog.getString("Details");

        page.error = {};

        page.submitted = false;

        clearErrors();

        page.send = function () {
            if(isFormValid()) {
                var message;
                dataService.supportTicket(page.name, page.subject, page.details, page.email, page.cc).then(
                    function() {
                        message = gettextCatalog.getString("Help ticket has been submitted");
                        window.plugins.toast.showLongBottom(message, function() {
                            page.close();
                        });
                    },
                    function() {
                        message = gettextCatalog.getString("There was a problem sending the help ticket");
                        window.plugins.toast.showLongBottom(message, function() {
                            page.close();
                        });
                    }

                );

            } else {
                page.submitted = true;
                if(page.email.length === 0) {
                    page.error.email = gettextCatalog.getString("Email required");
                }
                if(page.subject.length === 0) {
                    page.error.subject = gettextCatalog.getString("Subject required");
                }
            }
        };

        page.close = function() {
            $scope.mainNavigator.popPage();
        };

        page.hasFieldError = function(field) {
            return (page.submitted === true && field.length === 0);
        };

        function clearErrors() {
            page.error.email = "";
            page.error.subject = "";
        }

        function isFormValid() {
            clearErrors();
            return page.email.length > 0 && page.subject.length > 0;
        }
    }
})();
