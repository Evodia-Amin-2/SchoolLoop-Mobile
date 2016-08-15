(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('CoursesController', ['$scope', '$timeout', '$location', 'DataService', 'DataType', 'StatusService', 'LoopmailService', 'Utils', CoursesController])
        .controller('CourseDetailController', ['$scope', '$timeout', 'DataService', 'StatusService', 'Utils', 'CourseColors', CourseDetailController])
    ;

    function CoursesController($scope, $timeout, $location, dataService, DataType, statusService, loopmailService, utils) {
        var courseCtrl = this;

        navigator.analytics.sendAppView('Courses');

        courseCtrl.courses = dataService.list(DataType.COURSE);

        courseCtrl.load = function($done) {
            $timeout(function() {
                return dataService.refresh(DataType.COURSE).then(function(result) {
                    courseCtrl.courses = result;
                    $done();
                }, function() {
                    $done();
                });
            }, 1000);
        };

        courseCtrl.hasGrade = function(course) {
            return !(utils.isNull(course.grade) === true || course.grade === 'hidden');
        };

        courseCtrl.hasScore = function(course) {
            return !(utils.isNull(course.score) === true || course.score === 'hidden');
        };

        courseCtrl.showCourse = function(course) {
            statusService.showLoading();
            dataService.setCourseTitle(course.period + " - " + course.courseName);
            $location.path("main.tabs.courses-detail", {periodID: course.periodID});
        };

        courseCtrl.hasCoTeacher = function(item) {
            return _.isUndefined(item.coTeacherName) === false && utils.isNull(item.coTeacherName) === false;
        };

        courseCtrl.courseColor = function(item) {
            var periodIndex = ((item.period - 1) % 10) + 1;
            return "period-" + periodIndex;
        };

        $scope.$on("refresh.all", function() {
            courseCtrl.courses = dataService.list(DataType.COURSE);
        });

        $scope.courseNavigator.on("prepop", function() {
            StatusBar.backgroundColorByHexString("#009688");
            StatusBar.show();
        });

        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("prechange", function() {
            var pages = $scope.courseNavigator.pages;
            if(pages.length > 1) {
                $scope.courseNavigator.popPage();
            }
        });
    }

    function CourseDetailController($scope, $timeout, dataService, statusService, utils, CourseColors) {
        var courseDetail = this;

        courseDetail.course = $scope.courseNavigator.topPage.pushedOptions.course;
        courseDetail.progress = $scope.courseNavigator.topPage.pushedOptions.progress;

        var periodIndex = (courseDetail.course.period - 1) % 10;
        StatusBar.backgroundColorByHexString(CourseColors[periodIndex]);
        StatusBar.show();

        courseDetail.zeroCount = 0;
        courseDetail.courseInfo = false;
        courseDetail.limit = 4;

        courseDetail.hasScore = function() {
            return _.isUndefined(courseDetail.progress.score) === false &&
                utils.isNull(courseDetail.progress.score) === false &&
                courseDetail.progress.score.length > 0;
        };

        courseDetail.hasGrade = function() {
            return _.isUndefined(courseDetail.progress.grade) === false &&
                utils.isNull(courseDetail.progress.grade) === false &&
                courseDetail.progress.grade.length > 0;
        };

        courseDetail.getScore = function() {
            return roundWithPrecision(courseDetail.progress.score * 100, courseDetail.progress.precision) + "%";
        };

        courseDetail.getGrade = function() {
            return courseDetail.progress.grade;
        };

        courseDetail.isZero = function(item) {
            return utils.isTrue(item.zero);
        };

        courseDetail.courseColor = function() {
            var periodIndex = ((courseDetail.course.period - 1) % 10) + 1;
            return "period-" + periodIndex;
        };

        courseDetail.viewAll = function() {
            courseDetail.limit = 1000000;
        };


        if(_.isUndefined(courseDetail.progress) === true) {
            courseDetail.progress = {};
            loadProgressReport(courseDetail.course.periodID);
        } else {
            processProgressReport();
            processCourseInfo();
        }

        function processProgressReport() {
            courseDetail.progress.grades = _.sortBy(courseDetail.progress.grades, function(o) { return o.assignment.dueDate; }).reverse();

            courseDetail.zeroCount = 0;
            for (var i = 0, len = courseDetail.progress.grades.length; i < len; i++) {
                var grade = courseDetail.progress.grades[i];
                if (utils.isTrue(grade.zero) === true) {
                    courseDetail.zeroCount += 1;
                }
            }
        }

        function processCourseInfo() {
            if(_.isUndefined(courseDetail.progress.GradingScale) === false) {
                var cutoffs = courseDetail.progress.GradingScale.Cutoffs || [];
                var mid = Math.ceil(cutoffs.length / 2);
                courseDetail.scale = [];
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

                    courseDetail.scale.push(list);
                }
            }

            courseDetail.definitions = courseDetail.progress.gradeDefinitions || [];
        }


        function loadProgressReport(periodId) {
            dataService.getProgressReport(periodId).then(function(response) {
                statusService.hideWait(500);

                courseDetail.progress = response[0];

                processProgressReport();

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

                    courseDetail.options = {
                        lines: {
                            show: true
                        },
                        series: {
                            lines: { show: true, fill: 0.7, fillColor: false, zero: false, lineWidth: 5 }
                        },
                        colors: [CourseColors[(courseDetail.course.period - 1) % 10]],
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
