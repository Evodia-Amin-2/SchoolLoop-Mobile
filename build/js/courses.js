(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('CoursesController', ['$scope', '$location', 'DataService', 'DataType', 'StatusService', 'LoopmailService', CoursesController])
        .controller('CourseDetailController', ['$scope', '$timeout', 'DataService', 'StatusService', CourseDetailController])
    ;

    function CoursesController($scope, $location, dataService, DataType, statusService, loopmailService) {
        var courseCtrl = this;

        navigator.analytics.sendAppView('Courses');

        courseCtrl.courses = dataService.list(DataType.COURSE);

        courseCtrl.pullRefresh = function() {
            return dataService.refresh(DataType.COURSE).then(function(result) {
                $scope.courses = result;
                return result;
            }, function(error) {
                return error;
            });
        };

        courseCtrl.hasGrade = function(course) {
            return !(course.grade === 'null' || course.grade === 'hidden');
        };

        courseCtrl.hasScore = function(course) {
            return !(course.score === 'null' || course.score === 'hidden');
        };

        courseCtrl.showCourse = function(course) {
            statusService.showLoading();
            dataService.setCourseTitle(course.period + " - " + course.courseName);
            $location.path("main.tabs.courses-detail", {periodID: course.periodID});
        };

        courseCtrl.hasCoTeacher = function(item) {
            return _.isUndefined(item.coTeacherName) === false && item.coTeacherName !== null;
        };

        courseCtrl.courseColor = function(item) {
            var period = item.period;
            return "period-" + period;
        };

        $scope.$on("menu.loopmail", function() {
            loopmailService.setRecipients(undefined);
            $location.path("main.compose");
        });
    }

    function CourseDetailController($scope, $timeout, dataService, statusService) {
        var courseDetail = this;

        courseDetail.course = $scope.courseNavigator.topPage.pushedOptions.course;

        courseDetail.loaded = false;
        courseDetail.assignmentsLoaded = false;
        courseDetail.progress = {};
        courseDetail.assignments = [];
        courseDetail.zeros = [];
        courseDetail.courseInfo = false;

        courseDetail.hasScore = function() {
            return _.isUndefined(courseDetail.progress.score) === false && courseDetail.progress.score !== "null";
        };

        courseDetail.hasGrade = function() {
            return _.isUndefined(courseDetail.progress.grade) === false && courseDetail.progress.grade !== "null";
        };

        courseDetail.getScore = function() {
            return roundWithPrecision(courseDetail.progress.score * 100, courseDetail.progress.precision) + "%";
        };

        courseDetail.getGrade = function() {
            return courseDetail.progress.grade;
        };

        courseDetail.courseColor = function() {
            return "period-" + courseDetail.course.period;
        };

        loadProgressReport(courseDetail.course.periodID);

        function loadProgressReport(periodID) {
            dataService.getProgressReport(periodID).then(function(response) {
                courseDetail.loaded = true;
                statusService.hideWait(500);

                courseDetail.progress = response[0];

                courseDetail.progress.grades = _.sortBy(courseDetail.progress.grades, function(o) { return o.assignment.dueDate; }).reverse();

                var total = 0;
                for (var i = 0, len = courseDetail.progress.grades.length; i < len; i++) {
                    var grade = courseDetail.progress.grades[i];
                    if (grade.zero === "true" || grade.zero === true) {
                        total += 1;
                        courseDetail.zeros.push(grade);
                    }
                }

                $timeout(loadChart, 100);

                function loadChart() {
                    var min = 100;
                    var max = 0;
                    courseDetail.chartData = [];
                    var series = [];
                    var scores = courseDetail.progress.trendScores;
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
                        series.push([courseDetail.progress.date, 0]);
                        min = 0;
                        max = 100;
                    }

                    courseDetail.chartData.push(series);

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

                    var periodColors = ["#0084b1", "#159501", "#673AB7", "#9C27B0", "#EAB102",
                        "#B96113", "#99CEE0", "#A1D59A", "#C2B0E2", "#D7A9DF"];


                    courseDetail.options = {
                        lines: {
                            show: true
                        },
                        series: {
                            lines: { show: true, fill: 0.7, fillColor: false, zero: false, lineWidth: 5 }
                        },
                        colors: [periodColors[(courseDetail.course.period - 1) % 10]],
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
                }

            });

        }

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
