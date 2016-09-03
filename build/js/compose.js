(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ComposeController', ['$scope', '$filter', '$sce', 'StorageService', 'LoopmailService', 'gettextCatalog', ComposeController])
    ;

    function ComposeController($scope, $filter, $sce, storageService, loopmailService, gettextCatalog) {
        var page = this;

        page.toList = [];
        page.ccList = [];
        page.subject = "";
        page.body = "";

        page.placeholder = {};
        page.placeholder.to = gettextCatalog.getString("To");
        page.placeholder.cc = gettextCatalog.getString("CC");
        page.placeholder.subject = gettextCatalog.getString("Subject");
        page.placeholder.body = gettextCatalog.getString("Message Text");

        // var domain = storageService.getDefaultDomain();
        // var userId = domain.user.userID;

        page.loading = true;

        page.removeCC = function(member) {
            page.ccList = _.without(page.ccList, _.findWhere(page.ccList, {id: member.id}));
        };

        page.cancel = function() {
            $scope.mainNavigator.popPage();
        };

        page.send = function() {
            $scope.mainNavigator.popPage();
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
