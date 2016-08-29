(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AssignmentsController', ['$scope', '$location', '$timeout', 'Utils',
                        'DataService', 'DataType', 'CourseColors', 'gettextCatalog', AssignmentsController])
        .controller('AssignmentDetailController', ['$scope', '$window', '$sce', 'StorageService',
                        'Utils', 'CourseColors', 'gettextCatalog', AssignmentDetailController])
    ;

    function AssignmentsController($scope, $location, $timeout, utils, dataService, DataType, CourseColors, gettextCatalog) {
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
            return utils.getDisplayDate(source, timeZone, gettextCatalog);
        };

        assignCtrl.courseColor = function(assignment) {
            if(_.isUndefined(assignment.periodNumber)) {
                var tokens = assignment.courseName.split(" Period ");
                if(tokens.length === 2) {
                    assignment.periodNumber = tokens[1];
                    assignment.courseName = tokens[0];
                }
            }

            var periodIndex = assignment.periodNumber % CourseColors.length;
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

        tabbar.addEventListener("reactive", function() {
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

    function AssignmentDetailController($scope, $window, $sce, storageService, utils, CourseColors, gettextCatalog) {
        var assignDetail = this;

        assignDetail.assignment = $scope.asgnNavigator.topPage.pushedOptions.assignment;

        var period = assignDetail.assignment.periodNumber;
        var periodIndex = period % CourseColors.length;
        StatusBar.backgroundColorByHexString(CourseColors[periodIndex]);
        StatusBar.show();

        assignDetail.courseColor = function() {
            return "period-" + periodIndex;
        };

        assignDetail.getDescription = function() {
            if(utils.isNull(assignDetail.assignment.description) === false) {
                return $sce.trustAsHtml(assignDetail.assignment.description);
            }
            return "";
        };


        assignDetail.getDate = function (source, timeZone) {
            return utils.getDisplayDate(source, timeZone, gettextCatalog);
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
