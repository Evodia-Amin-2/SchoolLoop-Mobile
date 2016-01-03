(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('LoopMailController', ['$rootScope', '$scope', '$timeout', '$state', 'DataService', 'DataType', 'StatusService',
            'LoopmailService', 'StorageService', 'NavbarService', 'gettextCatalog', LoopMailController])
        .controller('LoopMailDetailController', ['$rootScope', '$scope', '$window', '$state', '$stateParams', '$sce', '$filter',
            'StorageService', 'DataService', 'DataType', 'StatusService', 'NavbarService', 'gettextCatalog', LoopMailDetailController])
    ;

    function LoopMailController($rootScope, $scope, $timeout, $state, dataService, DataType, statusService,
                                loopmailService, storageService, navbarService, gettextCatalog) {

        navigator.analytics.sendAppView('LoopMail');

        $scope.loading = false;
        $scope.pageLoaded = false;
        $scope.loopmail = [];
        $scope.mailbox = dataService.getFolderId();

        navbarService.setTitle(gettextCatalog.getString("LoopMail"));

        $scope.noMailMessage = "";
        if(dataService.getFolderId() === 1) {
            $scope.loopmail = dataService.list(DataType.LOOPMAIL);
            setMessage();
        } else if(dataService.getFolderId() === 2) {
            dataService.getLoopmail().then(function(response) {
                $scope.loopmail = response;
                setMessage();
            });
        } else {
            $scope.loopmail = storageService.getOutgoingMail();
            $scope.noMailMessage = gettextCatalog.getString("All Mail Delivered");
        }
        var page = 1;

        navbarService.reset();
        navbarService.setLoopMenuEnabled(true);
//        if(isTeacher()) {
            navbarService.setMailEnabled(true);
//        }

        $scope.parentScope = $scope;

        $timeout(function() {
            $scope.pageLoaded = true;
        }, 250);

        $scope.pullRefresh = function() {
            page = 1;
            if(dataService.getFolderId() === 1) {
                return dataService.refresh(DataType.LOOPMAIL).then(function(result) {
                    $scope.loopmail = result;
                    return result;
                }, function(error) {
                    return error;
                });
            } else if(dataService.getFolderId() === 2) {
                dataService.getLoopmail().then(function(response) {
                    $scope.loopmail = response;
                });
            }
        };

        $scope.removeOutgoing = function (message) {
            $scope.loopmail = storageService.removeOutgoingMail(message);
        };

        $scope.sender = function(message) {
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

        $scope.isNew = function(message) {
            return message.read === 'false' || message.read === 'null';
        };

        $scope.showMessage = function(message) {
            if(dataService.getFolderId() > 0) {
                statusService.showLoading();
                $state.go("main.tabs.loopmail-detail", {loopmailId: message.ID});
            }
        };

        $scope.$watch("loopmail.length", function() {
            if($scope.loopmail) {
                $scope.needsMore = ($scope.loopmail.length % 20 === 0) && ($scope.loopmail.length > 0);

                $timeout(function() {
                    $rootScope.$broadcast("scroll.refresh");
                });
            }
        });

        $scope.scrollListener = function(data) {
            if($scope.loading === true) {
                return;
            }

            var end = (data.max - data.top) < 100;
            if(end === true && $scope.needsMore === true) {
                $scope.loading = true;
                dataService.getLoopmail(page).then(function(response) {
                    $scope.loading = false;
                    $scope.loopmail = $scope.loopmail.concat(response);
                    page++;
                });
            }
        };

        $scope.$on("loopmail.sent", function() {
            if(dataService.getFolderId() < 0) {
                $scope.loopmail = storageService.getOutgoingMail();
                $scope.noMailMessage = gettextCatalog.getString("All Mail Delivered");
            }

        });

        $scope.$on("menu.loopmail", function() {
            loopmailService.setRecipients(undefined);
            $state.go("main.compose");
        });

        $scope.$on("menu.dropdown", function(event, data) {
            var index = data.index;
            $scope.loopmail = undefined;
            dataService.setLoopmailFolder(index);
            $scope.mailbox = dataService.getFolderId();
            if(dataService.getFolderId() < 0) {
                $scope.loopmail = storageService.getOutgoingMail();
                $scope.noMailMessage = gettextCatalog.getString("All Mail Delivered");
                return;
            }

            statusService.showLoading();
            dataService.getLoopmail().then(function(response) {
                $scope.loopmail = response;
                setMessage();
                statusService.hideWait(500);
            }, function() {
                statusService.hideWait(500);
                setMessage();
            });
        });

        $scope.$on('notify.loopmail', function() {
            if(dataService.getFolderId() === 1) {
                $scope.pullRefresh();
            }
        });

        function setMessage() {
            $scope.noMailMessage = "";
            if($scope.loopmail && $scope.loopmail.length === 0) {
                $scope.noMailMessage = gettextCatalog.getString("No Mail Currently");
            }
        }
    }

    function LoopMailDetailController($rootScope, $scope, $window, $state, $stateParams, $sce, $filter, storageService,
                                      dataService, DataType, statusService, navbarService, gettextCatalog) {
        var loopmailId = $stateParams.loopmailId;
        $scope.loaded = false;
        navbarService.reset();
        navbarService.setReplyEnabled(true);

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
                navbarService.setTitle(loopmail.subject);
                navbarService.setBackEnabled(true);

                if(loopmail.message) {
                    message = $filter('replaceUrlFilter')(loopmail.message);
                    $scope.trustedMessage = $sce.trustAsHtml(message);
                }
            }
            $rootScope.$broadcast("scroll.refresh");
        }, function(response) {
            navbarService.setTitle("Error");
            navbarService.setBackEnabled(true);
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
                $state.go("main.reply", {loopmailId: $scope.loopmail.ID, replyAll: false});
            } else if(index === 1) { // replay all
                $state.go("main.reply", {loopmailId: $scope.loopmail.ID, replyAll: true});
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
