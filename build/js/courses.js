(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('CoursesController', ['$scope', '$state', 'DataService', 'DataType', 'StorageService', 'StatusService', 'NavbarService', 'LoopmailService', CoursesController])
        .controller('CourseDetailController', ['$rootScope', '$scope', '$window', '$timeout', '$filter', '$state', '$stateParams',
            'DataService', 'StatusService', 'NavbarService', 'LoopmailService', 'gettextCatalog', CourseDetailController])
    ;

    function CoursesController($scope, $state, dataService, DataType, storageService, statusService, navbarService, loopmailService) {

        navigator.analytics.sendAppView('Courses');

        $scope.courses = dataService.list(DataType.COURSE);

        $scope.parentScope = $scope;

        navbarService.reset();
        navbarService.setMailEnabled(true);

        $scope.pullRefresh = function() {
            return dataService.refresh(DataType.COURSE).then(function(result) {
                $scope.courses = result;
                return result;
            }, function(error) {
                return error;
            });
        };

        $scope.isGradeEnabled = function() {
            var school = storageService.getSelectedSchool();
            return _.isUndefined(school) === false && _.isNull(school) === false && school.grades === 'true';
        };

        $scope.isGradeHidden = function(course) {
            return course.score === 'null' || course.score === 'hidden';
        };

        $scope.showCourse = function(course) {
            statusService.showLoading();
            dataService.setCourseTitle(course.period + " - " + course.courseName);
            $state.go("main.tabs.courses-detail", {periodID: course.periodID});
        };

        $scope.hasCoTeacher = function(item) {
            return _.isUndefined(item.coTeacherName) === false && item.coTeacherName !== 'null';
        };

        $scope.$on("menu.loopmail", function() {
            loopmailService.setRecipients(undefined);
            $state.go("main.compose");
        });
    }

    function CourseDetailController($rootScope, $scope, $window, $timeout, $filter, $state, $stateParams,
                                    dataService, statusService, navbarService, loopmailService, gettextCatalog) {
        var periodID;

        $scope.loaded = false;
        $scope.assignmentsLoaded = false;
        $scope.progress = {};
        $scope.assignments = [];
        $scope.zeros = [];
        $scope.courseInfo = false;

        $scope.zeroCollapse = true;
        $scope.assignCollapse = true;
        $scope.scoresCollapse = false;
        $scope.chartHeight = "100%";
        if(isAndroid2() === true) {
            $scope.chartHeight = "180px";
        }

        navbarService.reset();
        navbarService.setMailEnabled(true);
        navbarService.setBackEnabled(true);

        var courseTitle = dataService.getCourseTitle();
        navbarService.setTitle(courseTitle);

        $scope.$on('notify.assignment grade update', function(event, data) {
            var payload = data.payload;
            loadProgressReport(payload.periodid);
        });

        $scope.$on('notify.letter grade update', function(event, data) {
            var payload = data.payload;
            loadProgressReport(payload.periodid);
        });

        loadProgressReport($stateParams.periodID);

        function loadProgressReport(id) {
            periodID = id;

            dataService.getProgressReport(periodID).then(function(response) {

                $scope.loaded = true;
                statusService.hideWait(500);

                $scope.progress = response[0];
                if($scope.progress.hasScore === 'false') {
                    $scope.progress.grades = [];
                    navbarService.setMailEnabled(false);
                    $timeout($scope.toggleAssign);
                    return;
                }

                $scope.progress.grades = _.sortBy($scope.progress.grades, function(o) { return o.assignment.dueDate; }).reverse();

                var total = 0;
                for (var i = 0, len = $scope.progress.grades.length; i < len; i++) {
                    var grade = $scope.progress.grades[i];
                    if (grade.zero === "true") {
                        total += 1;
                        $scope.zeros.push(grade);
                    }
                }

                $timeout(loadChart, 100);

                function loadChart() {
                    var min = 100;
                    var max = 0;
                    $scope.chartData = [];
                    var series = [];
                    var scores = $scope.progress.trendScores;
                    var minTime = Number.MAX_VALUE;
                    var maxTime = 0;
                    if (_.isUndefined(scores) === false) {
                        var len = scores.length;
                        var time;
                        var score;
                        if(len > 0) {
                            for (var i = 0; i < len; i++) {
                                time = Number(scores[i].dayID);
                                score = scores[i].score * 100;
                                series.push([time, score]);
                                min = score < min ? score : min;
                                max = score > max ? score : max;
                                minTime = Math.min(minTime, time);
                                maxTime = Math.max(maxTime, time);
                            }
                        }
                        if(len === 1) {
                            time = (new Date()).getTime();
                            score = scores[0].score * 100;
                            series.push([time, score]);
                            minTime = Math.min(minTime, time);
                            maxTime = Math.max(maxTime, time);
                        }
                        max = (max < 100 ? 100 : max);
                        min -= 5;
                    } else {
                        series.push([$scope.progress.date, 0]);
                        min = 0;
                        max = 100;
                    }

                    $scope.chartData.push(series);

                    var ONE_DAY = (1000 * 60 * 60 * 24);
                    var ONE_WEEK = ONE_DAY * 7;
                    var ONE_MONTH = ONE_WEEK * 4;
                    var tickSize = 1;
                    var tickType = "month";
                    var timeFormat = "%b";
                    if (maxTime - minTime < ONE_MONTH) {
                        timeFormat = "%b-%d";
                        if (maxTime - minTime > ONE_WEEK) {
                            tickSize = 7;
                        } else if (maxTime - minTime > (3 * ONE_DAY)) {
                            tickSize = 2;
                        }
                        tickType = "day";
                    } else if (maxTime - minTime < 2 * ONE_MONTH) {
                        timeFormat = "%b-%d";
                        tickSize = 15;
                        tickType = "day";
                    }

                    $scope.options = {
                        lines: {
                            show: true
                        },
                        series: {
                            lines: { show: true, fill: 0.2, fillColor: false, zero: false }
                        },
                        colors: ["#6197CD"],
                        xaxis: {
                            mode: "time",
                            minTickSize: [tickSize, tickType],
                            timeformat: timeFormat
                        },
                        yaxis: {
                            min: min,
                            max: max
                        },
                        grid: {
                            backgroundColor: null,
                            borderWidth: {bottom: 1, top: 1, right: 0, left: 1},
                            borderColor: {bottom: "#333333", top: "#d9d9d9", right: "#d9d9d9", left: "#333333"}
                        }
                    };

                    $rootScope.$broadcast("scroll.refresh");
                }

            });

        }

        $scope.calcPercent = function (item) {
            if($scope.isExtraCredit(item)) {
                return "";
            }
            if(item.score === '') {
                return 'null';
            }
            if (isNaN(item.score)) {
                var defs = $scope.progress.gradeDefinitions;
                for (var i = 0, len = defs.length; i < len; i++) {
                    var def = defs[i];
                    if (def.key.startsWith(item.score)) {
                        return def.value;
                    }
                }
            } else {
                if (item.assignment.maxPoints > 0) {
                    return $filter('percent')((item.score / item.assignment.maxPoints), 2);
                }
            }
            return "-";
        };

        $scope.parentScope = $scope;

        $scope.showAssignment = function (assignment) {
            $state.go("main.tabs.assignments-detail", {assignmentId: assignment.iD});
        };

        $scope.showGradedAssignment = function (grade) {
            $state.go("main.tabs.assignments-detail", {assignmentId: grade.assignment.systemID, score: grade.score, comment: grade.comment});
        };


        $scope.isExcused = function (item) {
            return item.score === "E" || item.percentScore === "E";
        };

        $scope.isZero = function (item) {
            return item.zero === "true";
        };

        $scope.isExtraCredit = function (item) {
            return item.assignment.categoryName === "Extra Credit";
        };

        $scope.hasGrade = function (item) {
            return _.isUndefined(item.grade) === false &&  item.grade.length > 0 && item.grade !== "-";
        };

        $scope.showScore = function () {
            if ($scope.progress.hideScore === 'false') {
                return true;
            }
            return false;
        };

        $scope.showGrade = function() {
            if ($scope.progress.hideScore === 'false') {
                return true;
            } else {
                if ($scope.progress.showLetterGradeIfScoreHidden) {
                    return true;
                }
            }
            return false;
        };

        $scope.getScore = function() {
            var value = $scope.progress.score;
            if (_.isUndefined(value) === false && _.isNull(value) === false) {
                return roundWithPrecision(value * 100, $scope.progress.precision) + "%";
            }
            return "";
        };

        $scope.getGrade = function() {
            return $scope.progress.grade;
        };

        $scope.getAssignmentScore = function (item) {
            if (item.score !== 'null' && item.score !== '') {
                if($scope.isExtraCredit(item)) {
                    return  item.score;
                } else {
                    return  item.score + "/" + item.assignment.maxPoints;
                }
            } else {
                return "null";
            }
        };

        $scope.isGradeHidden = function () {
            return ($scope.progress.grade === 'hidden' || $scope.progress.grade === 'Hidden');
        };

        $scope.hasScore = function() {
            if(_.isUndefined($scope.progress.hasScore) === true) {
                return true;
            }
            return $scope.progress.hasScore === 'true';
        };

        $scope.showCourseInfo = function(event) {
            var cutoffs = $scope.progress.GradingScale.Cutoffs || [];
            var mid = Math.ceil(cutoffs.length / 2);
            $scope.scale = [];
            for(var i = 0; i < mid; i++) {
                var value = cutoffs[i];
                var list = [];
                list.push({"name": value.Name, "start": value.Start});

                value = cutoffs[mid + i];
                if(value !== undefined) {
                    list.push({"name": value.Name, "start": value.Start});
                } else {
                    list.push(undefined);
                }

                $scope.scale.push(list);
            }

            navbarService.reset();
            navbarService.setTitle(gettextCatalog.getString('Course Info'));
            navbarService.setMailEnabled(false);
            navbarService.setEditMode(true);
            navbarService.setDoneEnabled(true);

            $scope.definitions = $scope.progress.gradeDefinitions || [];
            $scope.courseInfo = true;
            $rootScope.$broadcast("scroll.refresh");

            event.stopPropagation();
        };

        $scope.infoDone = function() {
            $scope.courseInfo = false;

            navbarService.reset();
            navbarService.setMailEnabled(true);
            var courseTitle = dataService.getCourseTitle();
            navbarService.setTitle(courseTitle);
            navbarService.setBackEnabled(true);

            $rootScope.$broadcast("scroll.refresh");
        };

        $scope.$on("menu.done", function() {
            $scope.infoDone();
        });

        $scope.$on("menu.cancel", function() {
            $scope.infoDone();
        });

        $scope.hasComment = function (grade) {
            return _.isUndefined(grade.comment) === false && grade.comment !== "null" && grade.comment.length > 0;
        };

        $scope.$on('menu.back', function() {
            if($scope.courseInfo === true) {
                $scope.infoDone();
            } else {
                $window.history.back();
            }
        });

        $scope.toggleAssign = function () {
            $scope.assignCollapse = !$scope.assignCollapse;
            if($scope.assignCollapse === false && $scope.assignments.length === 0) {
                $scope.assignmentsLoaded = false;
                dataService.getAssignmentsByCourse(periodID).then(function(response) {
                    $scope.assignments = response;
                    _.sortBy($scope.assignments.reverse(), function(o) { return o.dueDate; });
                    $scope.assignmentsLoaded = true;
                });
            }
        };


        $scope.toggleZero = function () {
            $scope.zeroCollapse = !$scope.zeroCollapse;
        };

        $scope.toggleScores = function () {
            $scope.scoresCollapse = !$scope.scoresCollapse;
        };

        $scope.swipeLeft = function() {
            $window.history.back();
        };

        $scope.swipeRight = function() {
            $window.history.back();
        };

        $scope.$on("menu.loopmail", function() {
            var teacher = $scope.progress.teacher;
            var coTeacher = $scope.progress.coTeacher;
            var recipients = [];
            recipients.push({name: teacher.name, id: teacher.systemID});
            if(_.isUndefined(coTeacher) === false) {
                recipients.push({name: coTeacher.name, id: coTeacher.systemID});
            }
            loopmailService.setRecipients(recipients);
            $state.go("main.compose");
        });
    }

    function isAndroid2() {
        var isAndroid = device.platform.toLowerCase() === "android";
        if(isAndroid === false) {
            return false;
        }
        return device.version.startsWith("2");
    }

    function roundWithPrecision(x, p) {
        //error checking
        if (p < 0) {
            p = 0;
        } else if (p > 10) {
            p = 10;
        }
        var a = [1, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 10000000000];
        return Math.round(x * a[p]) / a[p];
    }

})();
