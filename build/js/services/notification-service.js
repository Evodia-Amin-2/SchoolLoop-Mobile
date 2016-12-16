(function () {
    'use strict';

    angular.module('app.services')
        .factory('NotificationService', ['$rootScope', '$location', 'DataService', 'StorageService', 'StatusService', 'LoginService',
                                'config', 'gettextCatalog', NotificationService])
    ;

    function NotificationService($rootScope, $location, dataService, storageService, statusService, loginService,
                                 config, gettextCatalog) {
        var notificationData;
        var pushNotification;

        function register() {
            console.log("Register notification service: " + new Date());
            if(_.isUndefined(notificationData) === false) {
                doNotification(notificationData);
                notificationData = undefined;
            }
            pushNotification = PushNotification.init({ "android": {"senderID": config.senderId, "icon": "notification", "iconColor": "olive", sound: true},
                "ios": {"alert": "true", "badge": "false", "sound": "true"}, "windows": {} } );

            pushNotification.on('registration', function(data) {
                doPushRegister(data.registrationId);
            });

            pushNotification.on('notification', function(data) {
                console.log("notification " + JSON.stringify(data));

                if(storageService.isLoggedIn() === false) {
                    notificationData = data;
                    $location.path('/login');
                    return;
                }

                doNotification(data);
            });

            pushNotification.off('notification', function(data) {
                console.log("off notification " + JSON.stringify(data));
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
            config.deviceToken = deviceToken;

            var params = {
                "appId": config.id,
                "version": parseVersion(config.version),
                "devToken": deviceToken,
                "uuid": device.uuid,
                "devOS": device.platform
            };

            // Register each user in order to receive notifications
            var domainMap = storageService.getDomainMap();
            var domainName;
            for(domainName in domainMap) {
                if(domainMap.hasOwnProperty(domainName)) {
                    var domain = domainMap[domainName];
                    var user = domain.user;
                    dataService.setupAuthHeaders(user.userName, user.hashedPassword, {}, true);
                    dataService.registerDevice(params).then(regSuccess, regFailure);
                }
            }

            function regSuccess() {
                console.log("registered: " + deviceToken);
            }

            function regFailure() {
                console.log("error registering: " + deviceToken);
            }

        }

        function parseVersion(version) {
            var tokens = version.split(" ");
            return tokens[0];
        }

        function doNotification(data) {
            clearNotification();
            var additionalData = data.additionalData;
            var targetId = additionalData.targetid;
            if(_.isUndefined(targetId) === false) {
                var students = storageService.getStudents();
                var student = _.findWhere(students, {studentID: targetId});
                if(_.isUndefined(student) === true) {
                    // Look for parent
                    var parentSchool = storageService.getParentSchool(targetId);
                    if(_.isUndefined(parentSchool) === true) {
                        processNotification(data);
                        return;
                    }
                    for(var i = 0; i < students.length; i++) {
                        var school = students[i].school;
                        if(parentSchool.domainName === school.domainName) {
                            student = students[i];
                            targetId = student.studentID;
                            break;
                        }
                    }
                }
                if(_.isUndefined(student) === true) {
                    processNotification(data);
                    return;
                }
                dataService.clearCache();
                var message = gettextCatalog.getString("Switching to {}");
                storageService.setSelectedStudentId(targetId);
                message = message.replace("{}", student.name);
                statusService.showMessage(message);
                dataService.load().then(function() {
                    statusService.hideWait(1000);
                    $rootScope.$broadcast("refresh.all");
                    processNotification(data);
                });
            } else {
                processNotification(data);
            }
        }

        function processNotification(data) {
            var additionalData = data.additionalData;
            var notifyMessage = "notify." + additionalData.type;
            var foreground = additionalData.foreground;
            if(foreground === true) {
                var notification = gettextCatalog.getString("Notification");
                var view = gettextCatalog.getString("View");
                var cancel = gettextCatalog.getString("Cancel");
                navigator.notification.confirm(data.message, function(buttonIndex) {
                    var view = buttonIndex === 1;
                    $rootScope.$broadcast(notifyMessage, {message: data.message, payload: additionalData, view: view});
                }, notification, [view, cancel]);
            } else {
                $rootScope.$broadcast(notifyMessage, {message: data.message, payload: additionalData, view: true});
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

        var service = {
            register: register,
            unregister: unregister
        };
        return service;
    }
})();
