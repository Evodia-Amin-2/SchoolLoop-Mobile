(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AssignmentsController', ['$rootScope', '$scope', '$location', '$sce', '$timeout', 'LoopmailService',
                        'DataService', 'DataType', AssignmentsController])
        .controller('AssignmentDetailController', ['$scope', '$window', '$location', '$routeParams', '$sce', '$filter', 'StorageService',
                        'StatusService', 'LoopmailService', 'DataService', 'DataType', AssignmentDetailController])
        .filter('period', [PeriodFilter])
    ;

    function AssignmentsController($rootScope, $scope, $location, $sce, $timeout, loopmailService, dataService, DataType) {
        var assCtrl = this;

        navigator.analytics.sendAppView('Assignments');

        var assignments = dataService.list(DataType.ASSIGNMENT);
        if(_.isUndefined(assignments) === true) {
            $location.path("/start");
        }

        getTimeZone(assignments);
        assCtrl.assignments = groupAssignments(assignments, $scope);

        assCtrl.load = function($done) {
            $timeout(function() {
                return dataService.refresh(DataType.ASSIGNMENT).then(function(result) {
                    getTimeZone(result);
                    assCtrl.assignments = groupAssignments(result, $scope);
                    $done();
                }, function() {
                    $done();
                });
            }, 1000);
        };

        assCtrl.isToday = function (itemDate, timeZone) {
            return isToday(itemDate, timeZone);
        };

        assCtrl.isTomorrow = function (itemDate, timeZone) {
            return isTomorrow(itemDate, timeZone);
        };

        assCtrl.showAssignment = function (assignment) {
            $location.path("main.tabs.assignments-detail", {assignmentId: assignment.iD});
        };

        assCtrl.getDescription = function(assignment) {
            return $sce.trustAsHtml(assignment.description);
        };

        assCtrl.courseColor = function(assignment) {
            var period = assignment.courseName.split(" Period ")[1];
            var periodIndex = ((period - 1) % 10) + 1;
            return "period-" + periodIndex;
        };

        $scope.$on("menu.loopmail", function() {
            loopmailService.setRecipients(undefined);
            $location.path("main.compose");
        });

        $timeout(function() {
            $rootScope.$broadcast("scroll.refresh");
        }, 500);

        function getTimeZone(assignments) {
            if(assignments && assignments.length > 0) {
                var assignment = assignments[0];
                $scope.timeZone = assignment.timeZone;
            }
        }

    }

    function AssignmentDetailController($scope, $window, $location, $routeParams, $sce, $filter, storageService, statusService,
                                        loopmailService, dataService, DataType) {

        var assignments = dataService.list(DataType.ASSIGNMENT);

        $scope.comment = $routeParams.comment;
        var assignmentId = $routeParams.assignmentId;
        var score = $routeParams.score;
        var assignment = _.findWhere(assignments, {iD: assignmentId});
        if(!assignment) {
            statusService.showLoading();
            dataService.getAssignment(assignmentId, score).then(function(response) {
                setAssignment(response);
                statusService.hideWait(500);
            });
        } else {
            setAssignment(assignment);
        }

        $scope.calcPercent = function () {
            if (_.isUndefined($scope.assignment) === true) {
                return;
            }
            var assignment = $scope.assignment;
            if (assignment.maxPoints > 0) {
                return $filter('percent')((assignment.score / assignment.maxPoints), 2);
            }
            return "-";
        };

        $scope.isToday = function (itemDate, timeZone) {
            return isToday(itemDate, timeZone);
        };

        $scope.isTomorrow = function (itemDate, timeZone) {
            return isTomorrow(itemDate, timeZone);
        };

        $scope.openURL = function (link) {
            var url = link.URL;
            if(url.toLowerCase().startsWith("http") === false) {
                var school = storageService.getSelectedSchool().domainName;
                url = "http://" + school + url;
            }
            $window.open(url, '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');

        };

        $scope.hasDiscussion = function () {
            if (_.isUndefined($scope.assignment) === false) {
                return $scope.assignment.numMessages > 0;
            } else {
                return false;
            }
        };

        $scope.$on("menu.back", function() {
            $window.history.back();
        });

        $scope.swipeLeft = function() {
            $window.history.back();
        };

        $scope.swipeRight = function() {
            $window.history.back();
        };

        $scope.$on("menu.loopmail", function() {
            var recipients = [];
            recipients.push({name: $scope.assignment.teacherName, id: $scope.assignment.teacherID});
            recipients.push({name: $scope.assignment.coTeacherName, id: $scope.assignment.coTeacherID});
            loopmailService.setRecipients(recipients);
            $location.path("/main.compose");
        });

        function setAssignment(assignment) {
            $scope.assignment = assignment;
            $scope.trustedDescription = "";

            if(assignment) {

                if(assignment.description) {
                    var description = $filter('replaceUrlFilter')(assignment.description);
                    var school = storageService.getSelectedSchool().domainName;
                    description = $filter('replaceSrcFilter')(description, school);
                    $scope.trustedDescription = $sce.trustAsHtml(description);
                }
            }
        }
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
})();
