(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('LoopMailController', ['$rootScope', '$scope', '$timeout', 'DataService', 'DataType', 'StatusService',
            'LoopmailService', 'StorageService', 'gettextCatalog', 'Utils', LoopMailController])
        .controller('LoopMailDetailController', ['$rootScope', '$scope', '$window', '$sce', '$filter', '$timeout',
            'StorageService', 'DataService', 'DataType', 'StatusService', 'gettextCatalog', LoopMailDetailController])
    ;

    function LoopMailController($rootScope, $scope, $timeout, dataService, DataType, statusService,
                                loopmailService, storageService, gettextCatalog, utils) {
        var mailCtrl = this;

        navigator.analytics.sendAppView('LoopMail');

        mailCtrl.loading = false;
        mailCtrl.loopmail = [];

        mailCtrl.mailboxes = [
            {folderId: 1, action:"inbox", label:gettextCatalog.getString('Inbox')},
            {folderId: 2, action:"sent", label:gettextCatalog.getString('Sent')},
            {folderId: -1, action:"outbox", label:gettextCatalog.getString('Outbox')}
        ];

        var folderId = dataService.getFolderId();
        mailCtrl.mailbox = mailCtrl.mailboxes[convertToIndex(folderId)];

        mailCtrl.showMenu = function() {
            if($scope.popover._element[0].visible === false) {
                $scope.popover.show('.menu-popover');
            }
        };

        mailCtrl.selectMailbox = function(mailbox) {
            $scope.popover.hide();

            mailCtrl.loopmail = [];

            var folderId = mailbox.folderId;
            dataService.setLoopmailFolder(folderId);
            mailCtrl.mailbox = mailCtrl.mailboxes[convertToIndex(folderId)];
            if(folderId < 0) {
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
        };

        loadLoopMail();

        var page = 1;
        mailCtrl.load = function($done) {
            page = 1;
            $timeout(function() {
                if(dataService.getFolderId() === 1) {
                    return dataService.refresh(DataType.LOOPMAIL).then(function(result) {
                        mailCtrl.loopmail = result;
                        $rootScope.$broadcast("update.counter");
                        $done();
                    }, function() {
                        $done();
                    });
                } else if(dataService.getFolderId() === 2) {
                    dataService.getLoopmail().then(function(response) {
                        mailCtrl.loopmail = response;
                        $done();
                    });
                }
            }, 1000);
        };

        mailCtrl.removeOutgoing = function (message) {
            mailCtrl.loopmail = storageService.removeOutgoingMail(message);
        };

        mailCtrl.isOutbox = function() {
            var folderId = dataService.getFolderId();
            return folderId < 0;
        };

        mailCtrl.showDetail = function(message) {
            if(mailCtrl.isOutbox() === false) {
                $scope.loopmailNavigator.pushPage('loopmail-detail.html', {animation: 'slide', loopmail: message});
            } else {
                var title = gettextCatalog.getString("Confirm");
                var remove = gettextCatalog.getString("Remove");
                var cancel = gettextCatalog.getString("Cancel");
                var prompt = gettextCatalog.getString("Remove the message from outgoing queue?");
                navigator.notification.confirm(prompt, function(buttonIndex) {
                    if(buttonIndex === 1) {
                        $scope.$apply(function() {
                            mailCtrl.removeOutgoing(message);
                        });
                    }
                }, title, [remove, cancel]);
            }
        };

        mailCtrl.sender = function(message) {
            var folderId = dataService.getFolderId();
            if(folderId === 2) {
                return gettextCatalog.getString("To:") + " " + message.shortRecipientString;
            } else if(folderId === 1) {
                return gettextCatalog.getString("From:") + " " + message.sender.name;
            } else {
                if(!message.to) {
                    return "";
                }
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

        mailCtrl.compose = function() {
            $scope.mainNavigator.pushPage('compose.html', {animation: 'slide', hasLMT: false});
        };

        $scope.$on("refresh.all", function() {
            loadLoopMail();
        });

        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("postchange", function() {
            utils.resetTab($scope.loopmailNavigator, "loopmail.html");
        });

        tabbar.addEventListener("reactive", function() {
            utils.resetTab($scope.loopmailNavigator, "loopmail.html");
        });


        $scope.$on("loopmail.sent", function() {
            if(dataService.getFolderId() < 0) {
                mailCtrl.loopmail = storageService.getOutgoingMail();
                mailCtrl.noMailMessage = gettextCatalog.getString("All Mail Delivered");
            }

        });

        $scope.$on('notify.loopmail', function(event, data) {
            var payload = data.payload;
            dataService.update().then(
                function() {
                    loadLoopMail();
                    if(data.view === true) {
                        var domain = storageService.getDefaultDomain();
                        var user = domain.user;
                        var isTeacher = (user.role !== 'student' && user.role !== 'parent');
                        if(isTeacher) {
                            $scope.tabbar.setActiveTab(0);
                        } else {
                            $scope.tabbar.setActiveTab(2);
                        }
                        var loopmailId = payload.messageid;
                        $scope.loopmailNavigator.pushPage('loopmail-detail.html', {animation: 'slide', loopmail: {ID: loopmailId}});
                    }
                }
            );
        });

        function loadLoopMail() {
            mailCtrl.noMailMessage = "";
            if(dataService.getFolderId() === 1) {
                mailCtrl.loopmail = dataService.list(DataType.LOOPMAIL);
                $rootScope.$broadcast("update.counter");
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
        }

        function convertToIndex(folderId) {
            if(folderId < 0) {
                return 2;
            } else {
                return folderId - 1;
            }
        }

        function setMessage() {
            mailCtrl.noMailMessage = "";
            if(mailCtrl.loopmail && mailCtrl.loopmail.length === 0) {
                mailCtrl.noMailMessage = gettextCatalog.getString("No Mail Currently");
            }
        }
    }

    function LoopMailDetailController($rootScope, $scope, $window, $sce, $filter, $timeout, storageService,
                                      dataService, DataType, statusService, gettextCatalog) {
        var mailDetail = this;

        var loopmail = $scope.loopmailNavigator.topPage.pushedOptions.loopmail;
        loopmail.read = true;

        mailDetail.loaded = false;

        dataService.getMessage(loopmail.ID).then(function(response) {
            mailDetail.loaded = true;
            statusService.hideWait(500);

            var message;
            var mailList = dataService.list(DataType.LOOPMAIL);
            if(mailList) {
                message = _.findWhere(mailList, {ID: loopmail.ID});
                if(message) {
                    message.read = "true";
                    $rootScope.$broadcast("update.counter");
                }
            }

            mailDetail.loopmail = response;
            mailDetail.trustedMessage = "";
            if(mailDetail.loopmail) {
                if(mailDetail.loopmail.message) {
                    message = $filter('replaceUrlFilter')(mailDetail.loopmail.message);
                    mailDetail.trustedMessage = $sce.trustAsHtml(message);
                }
            }
        }, function(response) {
            mailDetail.loaded = true;
            statusService.hideWait(500);
            mailDetail.loopmail = {};
            mailDetail.trustedMessage = $sce.trustAsHtml("<p>" + response.data + "</p>");
            console.log("message error: " + JSON.stringify(response));
        });

        mailDetail.reply = function() {
            $scope.replyModal.show();
        };

        $scope.$on('reply.action', function(event, data) {
            $scope.replyModal.hide();
            if(data.action === "cancel") {
                return;
            } else {
                $scope.mainNavigator.pushPage('reply.html', {animation: 'slide', loopmail: mailDetail.loopmail, action: data.action});
            }
        });

        $scope.mainNavigator.on("prepop", function(event) {
            var navigator = event.navigator;
            if(navigator.pages.length === 2) {
                var page = navigator.pages[1];
                if(page.name === "reply.html") {
                    $timeout(function() {
                        $scope.loopmailNavigator.pages[1].backButton.style.display = "block";
                    });
                }
            }
            StatusBar.backgroundColorByHexString("#009688");
            StatusBar.show();
        });

        mailDetail.sender = function () {
            if (_.isUndefined(mailDetail.loopmail) || _.isUndefined(mailDetail.loopmail.sender)) {
                return "";
            }
            return gettextCatalog.getString("From:") + " " + mailDetail.loopmail.sender.name;
        };

        mailDetail.recipient = function () {
            if (_.isUndefined(mailDetail.loopmail)) {
                return "";
            }
            return gettextCatalog.getString("To:") + " " + _.pluck(mailDetail.loopmail.recipientList, 'name').join("; ");
        };

        mailDetail.hasCC = function () {
            if (_.isUndefined(mailDetail.loopmail)) {
                return false;
            }
            var recipients = mailDetail.loopmail.ccRecipientList;
            return _.isUndefined(recipients) === false;
        };

        mailDetail.recipientCC = function () {
            if (_.isUndefined(mailDetail.loopmail)) {
                return "";
            }
            return gettextCatalog.getString("CC:") + " " + _.pluck(mailDetail.loopmail.ccRecipientList, 'name').join("; ");
        };

        mailDetail.openURL = function (link) {
            var url = link.URL;
            if(url.toLowerCase().startsWith("http") === false) {
                var school = storageService.getSelectedSchool().domainName;
                url = "http://" + school + url;
            }
            $window.open(url, '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');

        };

    }
})();
