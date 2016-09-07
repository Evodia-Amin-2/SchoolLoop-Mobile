(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ReplyController', ['$scope', '$q', '$filter', '$sce', 'DataService', 'StorageService', 'LoopmailService', 'gettextCatalog', ReplyController])
        ;

        function ReplyController($scope, $q, $filter, $sce, dataService, storageService, loopmailService, gettextCatalog) {
            var page = this;

            StatusBar.backgroundColorByHexString("#009688");
            StatusBar.show();

            var action = $scope.mainNavigator.topPage.pushedOptions.action;
            var loopmail = $scope.mainNavigator.topPage.pushedOptions.loopmail;

            page.toList = [];
            page.ccList = [];
            page.subject = "";
            page.body = "";

            page.placeholder = {};
            page.placeholder.to = gettextCatalog.getString("To");
            page.placeholder.cc = gettextCatalog.getString("CC");
            page.placeholder.subject = gettextCatalog.getString("Subject");
            page.placeholder.body = gettextCatalog.getString("Message Text");

            page.replyAll = (action === "reply-all");
            page.title = page.replyAll ? gettextCatalog.getString("Reply All") : gettextCatalog.getString("Reply");

            var subject = loopmail.subject;
            if (subject.startsWith("Re: ")) {
                page.subject = subject;
            } else {
                page.subject = "Re: " + subject;
            }

            var today = $filter('date')(loopmail.date,'MMM d, yyyy @ HH:mm');
            var message = "<p>On " + today + ", <b>" + loopmail.sender.name +
                "</b>  wrote:</p><blockquote>" + loopmail.message + "</blockquote>";
            page.originalMsg = $sce.trustAsHtml(message);

            var domain = storageService.getDefaultDomain();
            var userId = domain.user.userID;

            page.toList.push({name: loopmail.sender.name, id: loopmail.sender.userID});
            if(page.replyAll === true) {
                var recipient;
                var recipientList = loopmail.recipientList || {};
                for (var i = 0, len = recipientList.length; i < len; i++) {
                    recipient = recipientList[i];
                    if(recipient.userID !== userId) {
                        page.toList.push({name: recipient.name, id: recipient.userID});
                    }
                }

                recipientList = loopmail.ccRecipientList || {};
                for (i = 0, len = recipientList.length; i < len; i++) {
                    recipient = recipientList[i];
                    if(recipient.userID !== userId) {
                        page.ccList.push({name: recipient.name, id: recipient.userID});
                    }
                }
            }

            page.error = {};

            page.submitted = false;
            page.loading = true;

            clearErrors();

            page.send = function () {
                if(isFormValid()) {
                    loopmailService.send(page.toList, page.ccList, page.subject, page.body + "<br/><br/>" + page.originalMsg).then(
                        function() {
                            $scope.mainNavigator.popPage();
                            $scope.loopmailNavigator.resetToPage("loopmail.html");
                        },
                        function() {
                            $scope.mainNavigator.popPage();
                            $scope.loopmailNavigator.resetToPage("loopmail.html");
                        }
                    );
                } else {
                    page.submitted = true;
                    if(page.toList.length === 0) {
                        page.error.to = gettextCatalog.getString("Must include a recipient");
                    }
                    if(page.subject.length === 0) {
                        page.error.subject = gettextCatalog.getString("Subject required");
                    }
                }
            };

            page.removeCC = function(member) {
                page.ccList = _.without(page.ccList, _.findWhere(page.ccList, {id: member.id}));
            };

            page.cancel = function() {
                $scope.mainNavigator.popPage();
            };

            page.searchContacts = function(search) {
                var deferred = $q.defer();

                dataService.getContacts(search).then(
                    function(data) {
                        deferred.resolve(data);
                    },
                    function(error) {
                        deferred.reject(error);
                    }
                );

                return deferred.promise;
            };

            page.hasFieldError = function(field) {
                return (page.submitted === true && field.length === 0);
            };

            function clearErrors() {
                page.error.to = "";
                page.error.subject = "";
            }

            function isFormValid() {
                clearErrors();
                return page.toList.length > 0 && page.subject.length > 0;
            }

        }
})();
