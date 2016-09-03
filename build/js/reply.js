(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ReplyController', ['$scope', '$filter', '$sce', 'StorageService', 'LoopmailService', 'gettextCatalog', ReplyController])
        ;

        function ReplyController($scope, $filter, $sce, storageService, loopmailService, gettextCatalog) {
            var page = this;

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

            page.replyAll = action === "reply-all";
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
                var recipientList = loopmail.recipientList || {};
                for (var i = 0, len = recipientList.length; i < len; i++) {
                    var recipient = recipientList[i];
                    if(recipient.userID !== userId) {
                        page.ccList.push({name: recipient.name, id: recipient.userID});
                    }
                }
            }

            page.loading = true;

            page.removeCC = function(member) {
                page.ccList = _.without(page.ccList, _.findWhere(page.ccList, {id: member.id}));
            };

            page.cancel = function() {
                $scope.mainNavigator.popPage();
            };

            page.send = function() {
                $scope.mainNavigator.resetToPage("loopmail.html");
                // if(_.isUndefined(page.subject) || page.subject.length === 0) {
                //     $scope.send_message.submitted = true;
                //     $scope.send_message.subject.$invalid = true;
                //     page.subjectError = gettextCatalog.getString("Subject required");
                // } else {
                //     loopmailService.send(page.toList, page.ccList, page.subject, page.body + "<br/><br/>" + page.originalMsg);
                // }
            };
        }
})();
