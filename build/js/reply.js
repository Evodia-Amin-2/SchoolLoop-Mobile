(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ReplyController', ['$rootScope', '$scope', '$window', '$timeout', '$filter', '$stateParams', '$sce', 'NavbarService',
            'DataService', 'LoopmailService', 'StorageService', 'gettextCatalog', ReplyController])
        ;

        function ReplyController($rootScope, $scope, $window, $timeout, $filter, $stateParams, $sce, navbarService,
                                 dataService, loopmailService, storageService, gettextCatalog) {
            var reply = this;

            navbarService.reset();
            navbarService.setEditMode(true);
            navbarService.setSendEnabled(true);

            reply.toList = [];
            reply.ccList = [];
            reply.subject = "";
            reply.body = "";

            reply.replyAll = $stateParams.replyAll === "true";
            var title = reply.replyAll ? gettextCatalog.getString("Reply All") : gettextCatalog.getString("Reply");
            navbarService.setTitle(title);

            var loopmailId = $stateParams.loopmailId;
            dataService.getMessage(loopmailId).then(function(response) {
                reply.message = response;

                var subject = reply.message.subject;
                if (subject.startsWith("Re: ")) {
                    reply.subject = subject;
                } else {
                    reply.subject = "Re: " + subject;
                }

                var today = $filter('date')(new Date(),'yyyy-MM-dd HH:mm');
                var message = "<p>On " + today + ", <b>" + reply.message.sender.name +
                "</b>  wrote:</p><blockquote>" + reply.message.message + "</blockquote>";
                reply.originalMsg = $sce.trustAsHtml(message);

                var domain = storageService.getDefaultDomain();
                var userId = domain.user.userID;

                reply.toList.push({name: reply.message.sender.name, id: reply.message.sender.userID});
                if(reply.replyAll === true) {
                    var recipientList = reply.message.recipientList || {};
                    for (var i = 0, len = recipientList.length; i < len; i++) {
                        var recipient = recipientList[i];
                        if(recipient.userID !== userId) {
                            reply.ccList.push({name: recipient.name, id: recipient.userID});
                        }
                    }
                }

                $timeout(function() {
                    $rootScope.$broadcast("scroll.refresh");
                }, 200);
            });

            reply.loading = true;

            reply.removeCC = function(member) {
                reply.ccList = _.without(reply.ccList, _.findWhere(reply.ccList, {id: member.id}));
            };

            $scope.$on("menu.send", function() {
                if(_.isUndefined(reply.subject) || reply.subject.length === 0) {
                    $scope.send_message.submitted = true;
                    $scope.send_message.subject.$invalid = true;
                    reply.subjectError = gettextCatalog.getString("Subject required");
                } else {
                    loopmailService.send(reply.toList, reply.ccList, reply.subject, reply.body + "<br/><br/>" + reply.originalMsg);
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
