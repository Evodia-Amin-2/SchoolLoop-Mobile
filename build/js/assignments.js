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
        $scope.assignments = groupAssignments(assignments, $scope);

        $scope.parentScope = $scope;

        navbarService.reset();
        navbarService.setMailEnabled(true);
        navbarService.setTitle(gettextCatalog.getString("Assignments"));

        $scope.pullRefresh = function() {
            return dataService.refresh(DataType.ASSIGNMENT).then(function(result) {
                $scope.assignments = groupAssignments(result, $scope);
                return result;
            }, function(error) {
                return error;
            });
        };

        $scope.isToday = function (itemDate) {
            return isToday(itemDate);
        };

        $scope.isTomorrow = function (itemDate) {
            return isTomorrow(itemDate);
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

        $scope.isToday = function (itemDate) {
            return isToday(itemDate);
        };

        $scope.isTomorrow = function (itemDate) {
            return isTomorrow(itemDate);
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

    function isToday(dateInMillis) {
        var today = new Date();
        return compareDate(dateInMillis, today);
    }

    function isTomorrow(dateInMillis) {
        var today = new Date();
        var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
        return compareDate(dateInMillis, tomorrow);
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

    function compareDate(dateInMillis, date2) {
        var date1 = new Date(Number(dateInMillis));
        var d1 = dateFloor(date1);
        var d2 = dateFloor(date2);
        return d1.getTime() === d2.getTime();
    }

    function dateFloor(d) {
        d.setHours(0, 0, 0, 0);
        return d;
    }
})();
