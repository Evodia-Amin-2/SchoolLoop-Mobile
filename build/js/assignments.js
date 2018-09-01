(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('AssignmentsController', ['$scope', '$location', '$timeout', 'Utils',
                        'DataService', 'StorageService', 'DataType', 'CourseColors', 'gettextCatalog', AssignmentsController])
        .controller('AssignmentDetailController', ['$scope', '$timeout', '$window', '$sce', '$filter', 'StorageService',
                        'Utils', 'CourseColors', 'gettextCatalog', AssignmentDetailController])
    ;

    function AssignmentsController($scope, $location, $timeout, utils, dataService, storageService, DataType, CourseColors, gettextCatalog) {
        var assignCtrl = this;

        navigator.analytics.sendAppView('Assignments');

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

        assignCtrl.showAssignmentDetail = function(assignment) {
            $scope.asgnNavigator.pushPage('assignment-detail.html', {data: {assignment: assignment}});

            var period = assignment.periodNumber;
            var periodIndex = period % CourseColors.length;
            utils.setStatusBar(CourseColors[periodIndex]);

        };

        function getTimeZone(assignments) {
            if(assignments && assignments.length > 0) {
                var assignment = assignments[0];
                $scope.timeZone = assignment.timeZone;
            }
        }

        $scope.$on("refresh.all", function() {
            initialize();
            // utils.resetTab($scope.asgnNavigator);
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

        $scope.$on('pulldown.refresh', function(event, data) {
            if(data.tabIndex === 0) {
                var $done = data.done;
                $timeout(function() {
                    return dataService.refresh(DataType.ASSIGNMENT).then(function(result) {
                        getTimeZone(result);
                        assignCtrl.assignments = groupAssignments(result, $scope);
                        $done();
                    }, function() {
                        $done();
                    });
                }, 1000);
            }
        });

        function assignmentNotification(data) {
            if(data.view === false) {
                return;
            }
            var payload = data.payload;
            dataService.refresh(DataType.ASSIGNMENT).then(
                function(result) {
                    $scope.tabbar.setActiveTab(0);
                    getTimeZone(result);
                    assignCtrl.assignments = groupAssignments(result, $scope);
                    var assignment = _.findWhere(assignCtrl.assignments, {iD: payload.assignmentid});
                    if(assignment) {
                        assignCtrl.showAssignmentDetail(assignment);
                    }
                }
            );
        }

        function initialize() {
            var assignments = dataService.list(DataType.ASSIGNMENT);
            if(_.isUndefined(assignments) === true) {
                $location.path("/start");
            }

            getTimeZone(assignments);
            assignCtrl.assignments = groupAssignments(assignments, $scope);

            $scope.asgnNavigator.on("prepop", function() {
                utils.setStatusBar("#009688");
                storageService.setBackButtonExit(true);
            });

            $scope.tabbar.on("prechange", function(event) {
                if (event.index === 0) {
                    utils.resetTab($scope.asgnNavigator);
                    utils.setStatusBar("#009688");
                }
            });

            $scope.tabbar.on("reactive", function() {
                utils.resetTab($scope.asgnNavigator);
                utils.setStatusBar("#009688");
            });

            utils.setStatusBar("#009688");

        }

        initialize();
    }

    function AssignmentDetailController($scope, $timeout, $window, $sce, $filter, storageService, utils, CourseColors, gettextCatalog) {
        var assignDetail = this;

        var data =  $scope.asgnNavigator.topPage.data;
        assignDetail.assignment = data.assignment;

        var period = assignDetail.assignment.periodNumber;
        var periodIndex = period % CourseColors.length;

        assignDetail.courseColor = function() {
            return "period-" + periodIndex;
        };

        assignDetail.getDescription = function() {
            if(utils.isNull(assignDetail.assignment.description) === false) {
                var description = $filter('replaceUrlFilter')(assignDetail.assignment.description);
                return $sce.trustAsHtml(description);
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
            cordova.InAppBrowser.open(url, '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');

        };

        assignDetail.hasDiscussion = function () {
            if (_.isUndefined(assignDetail.assignment) === false) {
                return assignDetail.assignment.numMessages > 0;
            } else {
                return false;
            }
        };

        assignDetail.hasCoTeacher = function(item) {
            return _.isUndefined(item.coTeacherName) === false && utils.isNull(item.coTeacherName) === false;
        };

        assignDetail.compose = function() {
            $scope.mainNavigator.pushPage('compose.html', {data: {hasLMT: true, teachers: assignDetail.assignment}});
        };

        storageService.setBackButtonExit(false);

        $scope.$on("hardware.backbutton", function() {
            if($scope.mainNavigator.pages.length > 1) {
                $scope.mainNavigator.popPage();
            } else if($scope.asgnNavigator.pages.length > 1) {
                $scope.asgnNavigator.popPage();
            }
        });

        $scope.mainNavigator.on("prepop", function() {
            if($scope.mainNavigator.pages.length === 2) {
                var period = assignDetail.assignment.periodNumber;
                var periodIndex = period % CourseColors.length;
                utils.setStatusBar(CourseColors[periodIndex]);

                $timeout(function() {
                    var pages = $scope.asgnNavigator.pages;
                    var button = pages[pages.length - 1].backButton;
                    if(_.isUndefined(button) === false) {
                        button.style.display = "block";
                    }
                });
            }
        });

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
