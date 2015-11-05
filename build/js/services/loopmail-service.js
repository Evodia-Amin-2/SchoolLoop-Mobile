(function() {
    'use strict';

    angular.module('app.services')
        .factory('LoopmailService', ['$rootScope', '$window', '$timeout', 'DataService', 'StorageService', 'gettextCatalog', LoopmailService])
    ;

    function LoopmailService($rootScope, $window, $timeout, dataService, storageService, gettextCatalog) {

        var RETRY_INTERVAL = 5 * 60 * 1000;  // every 5 minutes
        var RETRY_INTERVAL_FAST = 60 * 1000;  // every minute

        var paused = false;
        var timer = null;
        var retryIndex = 0;

        $rootScope.$on('hardware.pause', function() {
            console.log("LoopmailService: pause");
            paused = true;
            if(timer !== null) {
                $timeout.cancel(timer);
            }
        });

        $rootScope.$on('hardware.resume', function() {
            console.log("LoopmailService: resume");
            paused = false;
            timer = $timeout(retry, RETRY_INTERVAL_FAST);
        });

        function retry() {
            if(paused === true) {
                return;
            }

            var outgoingMail = storageService.getOutgoingMail();
            if(outgoingMail.length > 0 && retryIndex < outgoingMail.length) {
                console.log("LoopmailService: retry -  " + new Date());
                var message = outgoingMail[retryIndex++];
                sendmail(message);
            } else {
                retryIndex = 0;
                var interval = RETRY_INTERVAL_FAST;
                if(outgoingMail.length > 0) {
                    interval = RETRY_INTERVAL; // wait longer before retrying
                }
                timer = $timeout(retry, interval);
            }
        }

        function sendmail(message) {
            dataService.sendLoopMail(message.to, message.cc, message.subject, message.body).then(
                function(response) {
                    if(response.statusText === "OK") {
                        retryIndex = 0;
                        storageService.removeOutgoingMail(message);
                        $rootScope.$broadcast("loopmail.sent");
                    }
                    retry();
                },
                function() {
                    retry();
                }
            );
        }

        function queueFailure(toList, ccList, subject, body) {
            if(timer !== null) {
                $timeout.cancel(timer);
            }

            var params = {
                to: toList,
                cc: ccList,
                subject: subject,
                body: body,
                date: new Date().getTime()
            };
            storageService.addOutgoingMail(params);

            var title = gettextCatalog.getString("Failed to Deliver");
            var message = gettextCatalog.getString("There was a problem sending the message.  It has been placed in your outbox and an attempt to send again will automatically occur.");
            var button = gettextCatalog.getString("Close");
            navigator.notification.alert(message, function() {
                timer = $timeout(retry, RETRY_INTERVAL);
                $window.history.back();
            }, title, button);
        }

        return {
            "send": function(toList, ccList, subject, body) {
                dataService.sendLoopMail(toList, ccList, subject, body).then(
                    function(response) {
                        if(response.statusText === "OK") {
                            var message = gettextCatalog.getString("Success! LoopMail sent.");
                            window.plugins.toast.showLongBottom(message);
                            console.log(message);
                            $window.history.back();
                        } else {
                            queueFailure(toList, ccList, subject, body);
                        }
                    },
                    function() {
                        queueFailure(toList, ccList, subject, body);
                    }
                );
            },
            "start": function() {
                console.log("Starting loopmail service: " + new Date());
                timer = $timeout(retry, RETRY_INTERVAL_FAST);
            }
        };
    }
})();
