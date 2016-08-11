(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('LoopMailController', ['$rootScope', '$scope', '$timeout', '$location', 'DataService', 'DataType', 'StatusService',
            'LoopmailService', 'StorageService', 'gettextCatalog', LoopMailController])
        .controller('LoopMailDetailController', ['$rootScope', '$scope', '$window', '$location', '$sce', '$filter',
            'StorageService', 'DataService', 'DataType', 'StatusService', 'gettextCatalog', LoopMailDetailController])
    ;

    function LoopMailController($rootScope, $scope, $timeout, $location, dataService, DataType, statusService,
                                loopmailService, storageService, gettextCatalog) {
        var mailCtrl = this;

        navigator.analytics.sendAppView('LoopMail');

        mailCtrl.loading = false;
        mailCtrl.pageLoaded = false;
        mailCtrl.loopmail = [];
        mailCtrl.mailbox = dataService.getFolderId();

        mailCtrl.noMailMessage = "";
        if(dataService.getFolderId() === 1) {
            mailCtrl.loopmail = dataService.list(DataType.LOOPMAIL);
            setMessage();
        } else if(dataService.getFolderId() === 2) {
            dataService.getLoopmail().then(function(response) {
                mailCtrl.loopmail = response;
                setMessage();
            });
        } else {
            mailCtrl.loopmail = storageService.getOutgoingMail();
            mailCtrl.noMailMessage = gettextCatalog.getString("All Mail Delivered");
        }
        var page = 1;

        $timeout(function() {
            mailCtrl.pageLoaded = true;
        }, 250);

        mailCtrl.load = function($done) {
            page = 1;
            if(dataService.getFolderId() === 1) {
                return dataService.refresh(DataType.LOOPMAIL).then(function(result) {
                    mailCtrl.loopmail = result;
                    $done();
                }, function(error) {
                    $done();
                });
            } else if(dataService.getFolderId() === 2) {
                dataService.getLoopmail().then(function(response) {
                    mailCtrl.loopmail = response;
                    $done();
                });
            }
        };

        mailCtrl.removeOutgoing = function (message) {
            mailCtrl.loopmail = storageService.removeOutgoingMail(message);
        };

        mailCtrl.sender = function(message) {
            if(dataService.getFolderId() === 2) {
                return gettextCatalog.getString("To:") + " " + message.shortRecipientString;
            } else if(dataService.getFolderId() === 1) {
                return gettextCatalog.getString("From:") + " " + message.sender.name;
            } else {
                var result = gettextCatalog.getString("To:") + " ";
                for(var i = 0, len = message.to.length; i < len; i++) {
                    if(i > 0) {
                        result += ", ";
                    }
                    result += message.to[i].name;
                }
                return result;
            }
        };

        mailCtrl.isNew = function(message) {
            return message.read === 'false' || message.read === 'null';
        };

        mailCtrl.showMessage = function(message) {
            if(dataService.getFolderId() > 0) {
                statusService.showLoading();
                $location.path("main.tabs.loopmail-detail", {loopmailId: message.ID});
            }
        };

        $scope.$watch("loopmail.length", function() {
            if(mailCtrl.loopmail) {
                mailCtrl.needsMore = (mailCtrl.loopmail.length % 20 === 0) && (mailCtrl.loopmail.length > 0);

                $timeout(function() {
                    $rootScope.$broadcast("scroll.refresh");
                });
            }
        });

        mailCtrl.scrollListener = function(data) {
            if(mailCtrl.loading === true) {
                return;
            }

            var end = (data.max - data.top) < 100;
            if(end === true && mailCtrl.needsMore === true) {
                mailCtrl.loading = true;
                dataService.getLoopmail(page).then(function(response) {
                    mailCtrl.loading = false;
                    mailCtrl.loopmail = mailCtrl.loopmail.concat(response);
                    page++;
                });
            }
        };

        $scope.$on("loopmail.sent", function() {
            if(dataService.getFolderId() < 0) {
                mailCtrl.loopmail = storageService.getOutgoingMail();
                mailCtrl.noMailMessage = gettextCatalog.getString("All Mail Delivered");
            }

        });

        $scope.$on("menu.loopmail", function() {
            loopmailService.setRecipients(undefined);
            $location.path("main.compose");
        });

        $scope.$on("menu.dropdown", function(event, data) {
            var index = data.index;
            mailCtrl.loopmail = undefined;
            dataService.setLoopmailFolder(index);
            mailCtrl.mailbox = dataService.getFolderId();
            if(dataService.getFolderId() < 0) {
                mailCtrl.loopmail = storageService.getOutgoingMail();
                mailCtrl.noMailMessage = gettextCatalog.getString("All Mail Delivered");
                return;
            }

            statusService.showLoading();
            dataService.getLoopmail().then(function(response) {
                mailCtrl.loopmail = response;
                setMessage();
                statusService.hideWait(500);
            }, function() {
                statusService.hideWait(500);
                setMessage();
            });
        });

        $scope.$on('notify.loopmail', function() {
            if(dataService.getFolderId() === 1) {
                mailCtrl.pullRefresh();
            }
        });

        function setMessage() {
            mailCtrl.noMailMessage = "";
            if(mailCtrl.loopmail && mailCtrl.loopmail.length === 0) {
                mailCtrl.noMailMessage = gettextCatalog.getString("No Mail Currently");
            }
        }
    }

    function LoopMailDetailController($rootScope, $scope, $window, $location, $sce, $filter, storageService,
                                      dataService, DataType, statusService, gettextCatalog) {
        var mailDetail = this;

        mailDetail.loopmail = $scope.courseNavigator.topPage.pushedOptions.loopmail;

        $scope.loaded = false;

        dataService.getMessage(loopmailId).then(function(response) {

            $scope.loaded = true;
            statusService.hideWait(500);

            var message;
            var mailList = dataService.list(DataType.LOOPMAIL);
            if(mailList) {
                message = _.findWhere(mailList, {ID: loopmailId});
                if(message) {
                    message.read = "true";
                }
            }

            var loopmail = response;
            $scope.loopmail = loopmail;
            $scope.trustedMessage = "";
            if(loopmail) {

                if(loopmail.message) {
                    message = $filter('replaceUrlFilter')(loopmail.message);
                    $scope.trustedMessage = $sce.trustAsHtml(message);
                }
            }
            $rootScope.$broadcast("scroll.refresh");
        }, function(response) {
            $scope.loaded = true;
            statusService.hideWait(500);
            $scope.loopmail = {};
            $scope.trustedMessage = $sce.trustAsHtml("<p>" + response.data + "</p>");
            console.log("message error: " + JSON.stringify(response));
        });

        $scope.sender = function () {
            if (_.isUndefined($scope.loopmail) || _.isUndefined($scope.loopmail.sender)) {
                return "";
            }
            return gettextCatalog.getString("From:") + " " + $scope.loopmail.sender.name;
        };

        $scope.recipient = function () {
            if (_.isUndefined($scope.loopmail)) {
                return "";
            }
            return gettextCatalog.getString("To:") + " " + _.pluck($scope.loopmail.recipientList, 'name').join("; ");
        };

        $scope.hasCC = function () {
            if (_.isUndefined($scope.loopmail)) {
                return false;
            }
            var recipients = $scope.loopmail.ccRecipientList;
            return _.isUndefined(recipients) === false;
        };

        $scope.recipientCC = function () {
            if (_.isUndefined($scope.loopmail)) {
                return "";
            }
            return gettextCatalog.getString("CC:") + " " + _.pluck($scope.loopmail.ccRecipientList, 'name').join("; ");
        };

        $scope.openURL = function (link) {
            var url = link.URL;
            if(url.toLowerCase().startsWith("http") === false) {
                var school = storageService.getSelectedSchool().domainName;
                url = "http://" + school + url;
            }
            $window.open(url, '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');

        };

        $scope.$on("menu.dropdown", function(event, data) {
            var index = data.index;
            if(index === 0) { // reply
                $location.path("main.reply", {loopmailId: $scope.loopmail.ID, replyAll: false});
            } else if(index === 1) { // replay all
                $location.path("main.reply", {loopmailId: $scope.loopmail.ID, replyAll: true});
            }
        });

        $scope.$on('menu.back', function() {
            $window.history.back();
        });

        $scope.swipeLeft = function() {
            $window.history.back();
        };

        $scope.swipeRight = function() {
            $window.history.back();
        };
    }
})();
