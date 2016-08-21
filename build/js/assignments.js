(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AssignmentsController', ['$scope', '$location', '$sce', '$timeout',
                        'DataService', 'DataType', 'gettextCatalog', AssignmentsController])
        .controller('AssignmentDetailController', ['$scope', '$window', '$sce', 'StorageService',
                        'StatusService', 'DataService', 'DataType', 'Utils', 'CourseColors', AssignmentDetailController])
        .filter('period', [PeriodFilter])
        .filter('course', [CourseFilter])
    ;

    function AssignmentsController($scope, $location, $sce, $timeout, dataService, DataType, gettextCatalog) {
        var assignCtrl = this;

        navigator.analytics.sendAppView('Assignments');

        initialize();

        assignCtrl.load = function($done) {
            $timeout(function() {
                return dataService.refresh(DataType.ASSIGNMENT).then(function(result) {
                    getTimeZone(result);
                    assignCtrl.assignments = groupAssignments(result, $scope);
                    $done();
                }, function() {
                    $done();
                });
            }, 1000);
        };

        assignCtrl.getDate = function (source, timeZone) {
            var sourceDate;
            var today, future;
            if(timeZone) {
                sourceDate = moment(new Date(Number(source))).tz(timeZone);
                today = moment().tz(timeZone);
                future = moment().tz(timeZone);
            } else {
                sourceDate = moment(new Date(Number(source)));
                today = moment();
                future = moment();
            }
            future.add(1, 'days');

            var message;
            if(sourceDate.isSame(today, 'day')) {
                message = gettextCatalog.getString("Today");
                return message;
            } else if(sourceDate.isSame(future, 'day')) {
                message = gettextCatalog.getString("Tomorrow");
                return message;
            } else {
                future.add(6, 'days'); // 1 week from now
                if(sourceDate.isBefore(future)) {
                    return sourceDate.format("dddd");
                } else {
                    return sourceDate.format("MMM D, YYYY");
                }
            }
            return sourceDate.format("MMM D, YYYY");
        };


        assignCtrl.isToday = function (itemDate, timeZone) {
            return isToday(itemDate, timeZone);
        };

        assignCtrl.isTomorrow = function (itemDate, timeZone) {
            return isTomorrow(itemDate, timeZone);
        };

        assignCtrl.courseColor = function(assignment) {
            var period = assignment.periodNumber;
            var periodIndex = ((period - 1) % 10) + 1;
            return "period-" + periodIndex;
        };

        function getTimeZone(assignments) {
            if(assignments && assignments.length > 0) {
                var assignment = assignments[0];
                $scope.timeZone = assignment.timeZone;
            }
        }

        $scope.$on("refresh.all", function() {
            initialize();
        });

        $scope.$on('notify.test tomorrow', function(event, data) {
            assignmentNotification(data);
        });

        $scope.$on('notify.assignment tomorrow', function(event, data) {
            assignmentNotification(data);
        });

        $scope.$on('notify.assignment due', function(event, data) {
            assignmentNotification(data);
        });

        $scope.$on('notify.assignment assigned', function(event, data) {
            assignmentNotification(data);
        });

        $scope.$on('notify.test assigned', function(event, data) {
            assignmentNotification(data);
        });

        $scope.$on('notify.test due', function(event, data) {
            assignmentNotification(data);
        });

        function assignmentNotification(data) {
            if(data.view === false) {
                return;
            }
            var payload = data.payload;
            dataService.refresh(DataType.ASSIGNMENT).then(
                function(result) {
                    $scope.tabbar.setActiveTab(1);
                    getTimeZone(result);
                    assignCtrl.assignments = groupAssignments(result, $scope);
                    var assignment = _.findWhere(assignCtrl.assignments, {iD: payload.assignmentid});
                    if(assignment) {
                        $scope.asgnNavigator.pushPage('assignment-detail.html', {animation: 'slide', assignment: assignment});
                    }
                }
            );
        }

        $scope.asgnNavigator.on("prepop", function() {
            StatusBar.backgroundColorByHexString("#009688");
            StatusBar.show();
        });

        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("prechange", function() {
            var pages = $scope.asgnNavigator.pages;
            if(pages.length > 1) {
                $scope.asgnNavigator.popPage();
            }
        });

        function initialize() {
            var assignments = dataService.list(DataType.ASSIGNMENT);
            if(_.isUndefined(assignments) === true) {
                $location.path("/start");
            }

            getTimeZone(assignments);
            assignCtrl.assignments = groupAssignments(assignments, $scope);
        }
    }

    function AssignmentDetailController($scope, $window, $sce, storageService, statusService,
                                        dataService, DataType, utils, CourseColors) {
        var assignDetail = this;

        assignDetail.assignment = $scope.asgnNavigator.topPage.pushedOptions.assignment;

        var period = assignDetail.assignment.periodNumber;
        var periodIndex = (period - 1) % 10;
        StatusBar.backgroundColorByHexString(CourseColors[periodIndex]);
        StatusBar.show();

        assignDetail.courseColor = function() {
            return "period-" + (periodIndex + 1);
        };

        assignDetail.getDescription = function() {
            if(utils.isNull(assignDetail.assignment.description) === false) {
                return $sce.trustAsHtml(assignDetail.assignment.description);
            }
            return "";
        };

        assignDetail.isToday = function (itemDate, timeZone) {
            return isToday(itemDate, timeZone);
        };

        assignDetail.isTomorrow = function (itemDate, timeZone) {
            return isTomorrow(itemDate, timeZone);
        };

        assignDetail.openURL = function (link) {
            var url = link.URL;
            if(url.toLowerCase().startsWith("http") === false) {
                var school = storageService.getSelectedSchool().domainName;
                url = "http://" + school + url;
            }
            $window.open(url, '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');

        };

        assignDetail.hasDiscussion = function () {
            if (_.isUndefined(assignDetail.assignment) === false) {
                return assignDetail.assignment.numMessages > 0;
            } else {
                return false;
            }
        };
    }

    function isToday(source, timeZone) {
        var sourceDate;
        var today;
        if(timeZone) {
            sourceDate = moment(new Date(Number(source))).tz(timeZone);
            today = moment().tz(timeZone);
        } else {
            sourceDate = moment(new Date(Number(source)));
            today = moment();
        }
        return sourceDate.isSame(today, 'day');
    }

    function isTomorrow(source, timeZone) {
        var sourceDate;
        var tomorrow;
        if(timeZone) {
            sourceDate = moment(new Date(Number(source))).tz(timeZone);
            tomorrow = moment().tz(timeZone);
        } else {
            sourceDate = moment(new Date(Number(source)));
            tomorrow = moment();
        }
        tomorrow.add(1, 'days');
        return sourceDate.isSame(tomorrow, 'day');
    }

    function groupAssignments(data) {
        var dates = _.groupBy(data, 'dueDate');
        var assignments = [];
        var keys = Object.keys(dates);
        for(var i = 0, len = keys.length; i < len; i++) {
            var object = {};
            object.date = keys[i];
            object.list = dates[keys[i]];
            assignments.push(object);
        }
        return assignments;
    }

    function PeriodFilter() {
        return function(input) {
            if(_.isUndefined(input) === false) {
                return input.split(" Period ")[1];
            }
            return input;
        };
    }

    function CourseFilter() {
        return function(input) {
            if(_.isUndefined(input) === false) {
                return input.split(" Period ")[0];
            }
            return input;
        };
    }
})();
