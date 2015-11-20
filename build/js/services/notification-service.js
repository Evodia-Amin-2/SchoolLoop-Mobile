(function () {
    'use strict';

    angular.module('app.services')
        .factory('NotificationService', ['$rootScope', '$state', 'DataService', 'StorageService', 'DataType', 'config', 'gettextCatalog', NotificationService])
    ;

    function NotificationService($rootScope, $state, dataService, storageService, DataType, config, gettextCatalog) {
        var notificationData;
        var pushNotification;

        function register() {
            console.log("Register notification service: " + new Date());
            if(_.isUndefined(notificationData) === false) {
                doNotification(notificationData);
                notificationData = undefined;
            }
            pushNotification = PushNotification.init({ "android": {"senderID": config.senderId, "icon": "notification", "iconColor": "olive", sound: true},
                "ios": {"alert": "true", "badge": "true", "sound": "true"}, "windows": {} } );

            pushNotification.on('registration', function(data) {
                doPushRegister(data.registrationId);
            });

            pushNotification.on('notification', function(data) {
                console.log("notification " + JSON.stringify(data));

                if(storageService.isLoggedIn() === false) {
                    notificationData = data;
                    $state.go('login');
                    return;
                }

                doNotification(data);
            });

            pushNotification.on('error', function(e) {
                console.log("notification error " + JSON.stringify(e));
                // e.message
            });
        }

        $rootScope.$on('hardware.pause', function() {
            clearNotification();
        });

        function unregister() {
            if(_.isUndefined(pushNotification) === false) {
                pushNotification.unregister(function() {
                    console.log("unregister: success");
                }, function() {
                    console.log("unregister: error");
                });
            }
        }

        function doPushRegister(deviceToken) {
            console.log("attempting to register: " + deviceToken);

            var params = {
                "version": parseVersion(config.version),
                "devToken": deviceToken,
                "uuid": device.uuid,
                "devOS": device.platform
            };
            dataService.registerDevice(params).then(
                function () {
                    console.log("registered: " + deviceToken);
                }, function () {
                    console.log("error registering: " + deviceToken);
                }
            );
        }

        function parseVersion(version) {
            var tokens = version.split(" ");
            return tokens[0];
        }

        function doNotification(data) {
            var additionalData = data.additionalData;
            var notifyMessage = "notify." + additionalData.type;
            var foreground = additionalData.foreground;
            if(foreground === true) {
                var notification = gettextCatalog.getString("Notification");
                var view = gettextCatalog.getString("View");
                var cancel = gettextCatalog.getString("Cancel");
                navigator.notification.confirm(data.message, function(buttonIndex) {
                    if(buttonIndex === 2) {
                        return;
                    }
                    $rootScope.$broadcast(notifyMessage, {message: data.message, payload: additionalData});
                }, notification, [view, cancel]);
            } else {
                $rootScope.$broadcast(notifyMessage, {message: data.message, payload: additionalData});
            }
        }

        function clearNotification() {
            if(_.isUndefined(pushNotification) === false) {
                pushNotification.setApplicationIconBadgeNumber(function() {
                    console.log("clear badge success");
                }, function() {
                    console.log("clear badge error");
                }, 0);
            }
        }

        $rootScope.$on('notify.loopmail', function(event, data) {
            var payload = data.payload;
            dataService.update().then(
                function() {
                    $state.go("main.tabs.loopmail-detail", {loopmailId: payload.messageid});
                }
            );
        });

        $rootScope.$on('notify.assignment grade update', function(event, data) {
            courseNotification(data);
        });

        $rootScope.$on('notify.letter grade update', function(event, data) {
            courseNotification(data);
        });

        function courseNotification(data) {
            var courses = dataService.list(DataType.COURSE);
            var payload = data.payload;
            for(var i = 0, len = courses.length; i < len; i++) {
                var course = courses[i];
                if(course.periodID === payload.periodid) {
                    dataService.clearProgressReport();
                    dataService.setCourseTitle(course.period + " - " + course.courseName);
                    $state.go("main.tabs.courses-detail", {periodID: course.periodID});
                }
            }
        }

        $rootScope.$on('notify.test tomorrow', function(event, data) {
            assignmentNotification(data);
        });

        $rootScope.$on('notify.assignment tomorrow', function(event, data) {
            assignmentNotification(data);
        });

        $rootScope.$on('notify.assignment due', function(event, data) {
            assignmentNotification(data);
        });

        $rootScope.$on('notify.test due', function(event, data) {
            assignmentNotification(data);
        });

        function assignmentNotification(data) {
            var payload = data.payload;
            dataService.refresh(DataType.ASSIGNMENT).then(
                function() {
                    $state.go("main.tabs.assignments-detail", {assignmentId: payload.assignmentid});
                }
            );
        }

        var service = {
            register: register,
            unregister: unregister
        };
        return service;
    }
})();
