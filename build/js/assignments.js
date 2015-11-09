(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AssignmentsController', ['$rootScope', '$scope', '$state', '$timeout', 'NavbarService', 'LoopmailService', 'DataService', 'DataType', 'gettextCatalog', AssignmentsController])
        .controller('AssignmentDetailController', ['$scope', '$window', '$state', '$stateParams', '$sce', '$filter', 'StorageService',
                                                    'StatusService', 'LoopmailService', 'DataService', 'DataType', 'NavbarService', AssignmentDetailController])
    ;

    function AssignmentsController($rootScope, $scope, $state, $timeout, navbarService, loopmailService, dataService, DataType, gettextCatalog) {

        navigator.analytics.sendAppView('Assignments');

        var assignments = dataService.list(DataType.ASSIGNMENT);
        getTimeZone(assignments);
        $scope.assignments = groupAssignments(assignments, $scope);

        $scope.parentScope = $scope;

        navbarService.reset();
        navbarService.setMailEnabled(true);
        navbarService.setTitle(gettextCatalog.getString("Assignments"));

        $scope.pullRefresh = function() {
            return dataService.refresh(DataType.ASSIGNMENT).then(function(result) {
                getTimeZone(result);
                $scope.assignments = groupAssignments(result, $scope);
                return result;
            }, function(error) {
                return error;
            });
        };

        $scope.isToday = function (itemDate, timeZone) {
            return isToday(itemDate, timeZone);
        };

        $scope.isTomorrow = function (itemDate, timeZone) {
            return isTomorrow(itemDate, timeZone);
        };

        $scope.showAssignment = function (assignment) {
            $state.go("main.tabs.assignments-detail", {assignmentId: assignment.iD});
        };

        $scope.$on("menu.loopmail", function() {
            loopmailService.setRecipients(undefined);
            $state.go("main.compose");
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

    function AssignmentDetailController($scope, $window, $state, $stateParams, $sce, $filter, storageService, statusService,
                                        loopmailService, dataService, DataType, navbarService) {
        navbarService.reset();
        navbarService.setBackEnabled(true);
        navbarService.setMailEnabled(true);

        var assignments = dataService.list(DataType.ASSIGNMENT);

        $scope.comment = $stateParams.comment;
        var assignmentId = $stateParams.assignmentId;
        var score = $stateParams.score;
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
            $window.open(url, '_system', 'location=yes');

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
            $state.go("main.compose");
        });

        function setAssignment(assignment) {
            $scope.assignment = assignment;
            $scope.trustedDescription = "";

            if(assignment) {
                navbarService.setTitle(assignment.title);

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
        var tomorrow;
        if(timeZone) {
            sourceDate = moment(new Date(Number(source))).tz(timeZone);
            tomorrow = moment().startOf('day').tz(timeZone);
        } else {
            sourceDate = moment(new Date(Number(source)));
            tomorrow = moment().startOf('day');
        }
        tomorrow.add(1, 'days');
        return ! sourceDate.isAfter(tomorrow, 'days');
    }

    function isTomorrow(source, timeZone) {
        var sourceDate;
        var dayAfter;
        if(timeZone) {
            sourceDate = moment(new Date(Number(source))).tz(timeZone);
            dayAfter = moment().startOf('day').tz(timeZone);
        } else {
            sourceDate = moment(new Date(Number(source)));
            dayAfter = moment().startOf('day');
        }
        dayAfter.add(2, 'days');
        return ! isToday(source, timeZone) && ! sourceDate.isAfter(dayAfter);
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
})();
