(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('CoursesController', ['$scope', '$timeout', '$location', 'DataService', 'DataType', 'StatusService',
            'Utils', 'CourseColors', CoursesController])
        .controller('CourseDetailController', ['$scope', '$timeout', 'DataService', 'StatusService', 'Utils', 'gettextCatalog',
            'CourseColors', CourseDetailController])
        .controller('CourseAsgnController', ['$rootScope', '$scope', '$timeout', 'Utils', 'DataService', 'DataType',
            'CourseColors', CourseAsgnController])
        .controller('CourseAsgnDetailController', ['$scope', '$window', '$sce', '$filter', '$timeout', 'DataService', 'StatusService',
            'StorageService', 'Utils', 'CourseColors', 'gettextCatalog', CourseAsgnDetailController])
    ;

    function CoursesController($scope, $timeout, $location, dataService, DataType, statusService, utils, CourseColors) {
        var courseCtrl = this;

        navigator.analytics.sendAppView('Courses');

        utils.setStatusBar("#009688");

        courseCtrl.courses = dataService.list(DataType.COURSE);
        courseCtrl.currentCourse = -1;

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

        courseCtrl.showProgressLabel = function(course) {
            return course.grade === "hidden" && course.score === "hidden";
        };

        courseCtrl.showCourse = function(course) {
            courseCtrl.currentCourse = course.periodID;
            $location.path("main.tabs.courses-detail", {periodID: course.periodID});
        };

        courseCtrl.hasCoTeacher = function(item) {
            return _.isUndefined(item.coTeacherName) === false && utils.isNull(item.coTeacherName) === false;
        };

        courseCtrl.courseColor = function(item) {
            var periodIndex = item.period % CourseColors.length;
            return "period-" + periodIndex;
        };

        $scope.$on("refresh.all", function() {
            courseCtrl.courses = dataService.list(DataType.COURSE);
            utils.resetTab($scope.courseNavigator, "courses.html");
        });

        $scope.$on('notify.assignment grade update', function(event, data) {
            courseNotification(data);
        });

        $scope.$on('notify.letter grade update', function(event, data) {
            courseNotification(data);
        });

        function courseNotification(data) {
            if(data.view === false) {
                return;
            }

            dataService.refresh(DataType.COURSE).then(function(result) {
                courseCtrl.courses = result;
                var pages = $scope.courseNavigator.pages;
                var payload = data.payload;
                for(var i = 0, len = courseCtrl.courses.length; i < len; i++) {
                    var course = courseCtrl.courses[i];
                    if(course.periodID === payload.periodid) {
                        var activeTab = $scope.tabbar.getActiveTabIndex();
                        if(activeTab !== 1) {
                            $scope.tabbar.setActiveTab(1);
                        }
                        if(courseCtrl.currentCourse !== payload.periodid) {
                            courseCtrl.currentCourse = course.periodID;
                            dataService.clearProgressReport();
                        }
                        if(pages.length === 1) { // top page
                            $scope.courseNavigator.pushPage('course-detail.html', {animation: 'slide', course: course});
                        }
                        break;
                    }
                }
            });
        }

        $scope.courseNavigator.on("prepop", function() {
            var pages = $scope.courseNavigator.pages;
            if(pages.length === 2) {
                utils.setStatusBar("#009688");
            }
        });

        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("postchange", function() {
            utils.resetTab($scope.courseNavigator, "courses.html");
        });

        tabbar.addEventListener("reactive", function() {
            utils.resetTab($scope.courseNavigator, "courses.html");
        });
    }

    function CourseDetailController($scope, $timeout, dataService, statusService, utils, gettextCatalog, CourseColors) {
        var courseDetail = this;

        courseDetail.course = $scope.courseNavigator.topPage.pushedOptions.course;
        courseDetail.progress = $scope.courseNavigator.topPage.pushedOptions.progress;

        var periodIndex = courseDetail.course.period % CourseColors.length;
        utils.setStatusBar(CourseColors[periodIndex]);

        courseDetail.zeroCount = 0;
        courseDetail.courseInfo = false;
        courseDetail.limit = 100;

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

        courseDetail.gradeHidden = function() {
            return courseDetail.progress.grade === "hidden";
        };

        courseDetail.getScore = function() {
            if(utils.isNull(courseDetail.progress.score) === true) {
                return  gettextCatalog.getString("Info");
            }
            return roundWithPrecision(courseDetail.progress.score * 100, courseDetail.progress.precision) + "%";
        };

        courseDetail.getGrade = function() {
            return courseDetail.progress.grade;
        };

        courseDetail.isZero = function(item) {
            return utils.isTrue(item.zero);
        };

        courseDetail.courseColor = function() {
            var periodIndex = courseDetail.course.period % CourseColors.length;
            return "period-" + periodIndex;
        };

        courseDetail.compose = function() {
            $scope.mainNavigator.pushPage('compose.html', {animation: 'slide', hasLMT: true, teachers: courseDetail.course});
        };

        courseDetail.hasCoTeacher = function(item) {
            return _.isUndefined(item.coTeacherName) === false && utils.isNull(item.coTeacherName) === false;
        };

        courseDetail.hasComment = function (grade) {
            return _.isUndefined(grade.comment) === false && grade.comment !== "null" && grade.comment.length > 0;
        };

        $scope.mainNavigator.on("prepop", function(event) {
            if($scope.tabbar.getActiveTabIndex() !== 1) {
                return;
            }
            var navigator = event.navigator;
            if(navigator.pages.length === 2) {
                var page = navigator.pages[1];
                if(page.name === "compose.html") {
                    $timeout(function() {
                        $scope.courseNavigator.pages[1].backButton.style.display = "block";
                    });
                }

                var periodIndex = courseDetail.course.period % CourseColors.length;
                utils.setStatusBar(CourseColors[periodIndex]);
            }
        });

        if(_.isUndefined(courseDetail.progress) === true) {
            courseDetail.progress = {};
            loadProgressReport(courseDetail.course.periodID);
        } else {
            processProgressReport();
            processCourseInfo();
        }

        function processProgressReport() {
            courseDetail.progress.grades = _.sortBy(courseDetail.progress.grades, function(o) { return o.assignment.dueDate; }).reverse();
            courseDetail.zeroCount = countZeros(courseDetail.progress, utils);
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
            statusService.showLoading();
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
                        colors: [CourseColors[(courseDetail.course.period) % CourseColors.length]],
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

    function CourseAsgnController($rootScope, $scope, $timeout, utils, dataService, DataType, CourseColors) {
        var courseAsgn = this;

        courseAsgn.course = $scope.courseNavigator.topPage.pushedOptions.course;
        courseAsgn.progress = $scope.courseNavigator.topPage.pushedOptions.progress;
        courseAsgn.filter = $scope.courseNavigator.topPage.pushedOptions.filter || "all";

        $rootScope.$broadcast("filter.reset", {action: courseAsgn.filter});

        courseAsgn.zeroCount = countZeros(courseAsgn.progress, utils);

        loadAssignments();

        var periodIndex = courseAsgn.course.period % CourseColors.length;
        utils.setStatusBar(CourseColors[periodIndex]);

        courseAsgn.filterList = function() {
            $scope.filterModal.show();
        };

        courseAsgn.isZero = function(item) {
            return utils.isTrue(item.zero);
        };

        courseAsgn.courseColor = function() {
            var periodIndex = courseAsgn.course.period % CourseColors.length;
            return "period-" + periodIndex;
        };

        courseAsgn.hasComment = function (grade) {
            return _.isUndefined(grade.comment) === false && grade.comment !== "null" && grade.comment.length > 0;
        };

        courseAsgn.applyFilter = function(element) {
            if(courseAsgn.filter === "graded") {
                return utils.isNull(element.score) === false;
            } else if(courseAsgn.filter === "unscored") {
                return element.graded === false;
            } else if(courseAsgn.filter === "zeros") {
                return utils.isTrue(element.zero);
            }
            return true;
        };

        $scope.$on('filter.action', function(event, data) {
            $scope.filterModal.hide();
            if(data.action === "close") {
                return;
            }

            courseAsgn.filter = data.action;
            courseAsgn.grades = [];
            courseAsgn.loaded = false;

            $timeout(loadAssignments, 300);
        });

        function loadAssignments() {

            dataService.getAssignmentsByCourse(courseAsgn.course.periodID).then(
                function(result) {

                    var assignments = result;
                    var grades = courseAsgn.progress.grades.slice();

                    for(var i = 0; i < assignments.length; i++) {
                        var grade = undefined;
                        for(var j = 0; j < grades.length; j++) {
                            if(grades[j].assignment.systemID === assignments[i].iD) {
                                grade = JSON.parse(JSON.stringify(grades[j]));
                                break;
                            }
                        }
                        if(_.isUndefined(grade) === true) {
                            grade = {};
                            grade.zero = false;
                            grade.score = null;
                            grade.grade = null;
                            grade.graded = false;
                            grade.assignment = {};
                            grades.push(grade);
                        }
                        grade.assignment.categoryName = assignments[i].categoryName;
                        grade.assignment.dueDate = assignments[i].dueDate;
                        grade.assignment.maxPoints = assignments[i].maxPoints;
                        grade.assignment.systemID = assignments[i].iD;
                        grade.assignment.title = assignments[i].title;
                    }

                    courseAsgn.grades = _.sortBy(grades, function(o) {
                        return o.assignment.dueDate;
                    }).reverse();
                    courseAsgn.loaded = true;
                }
            );
        }
    }

    function CourseAsgnDetailController($scope, $window, $sce, $filter, $timeout, dataService, statusService, storageService, utils, CourseColors, gettextCatalog) {
        var assignDetail = this;

        assignDetail.assignment = undefined;
        assignDetail.grade = $scope.courseNavigator.topPage.pushedOptions.grade;
        assignDetail.course = $scope.courseNavigator.topPage.pushedOptions.course;
        assignDetail.trustedDescription = "";

        var period = assignDetail.course.period;
        var periodIndex = period % CourseColors.length;
        utils.setStatusBar(CourseColors[periodIndex]);

        var assignmentId = assignDetail.grade.assignment.systemID || assignDetail.assignment.systemID;
        dataService.getAssignment(assignmentId).then(function(response) {
            setAssignment(response);
            statusService.hideWait(500);
        });

        function setAssignment(assignment) {
            assignDetail.assignment = assignment;

            if(assignment && utils.isNull(assignment.description) === false) {
                var description = $filter('replaceUrlFilter')(assignment.description);
                var school = storageService.getSelectedSchool().domainName;
                description = $filter('replaceSrcFilter')(description, school);
                assignDetail.trustedDescription = $sce.trustAsHtml(description);
            }
        }

        assignDetail.courseColor = function() {
            return "period-" + periodIndex;
        };

        assignDetail.getDate = function (source, timeZone) {
            timeZone = timeZone || "UTC";
            return utils.getDisplayDate(source, timeZone, gettextCatalog);
        };

        assignDetail.hasCoTeacher = function() {
            var assignment = assignDetail.assignment;
            if(_.isUndefined(assignment) === false) {
                return _.isUndefined(assignment.coTeacherName) === false && utils.isNull(assignment.coTeacherName) === false;
            }
            return false;
        };

        assignDetail.openURL = function (link) {
            var url = link.URL;
            if(url.toLowerCase().startsWith("http") === false) {
                var school = storageService.getSelectedSchool().domainName;
                url = "http://" + school + url;
            }
            $window.open(url, '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');

        };

        assignDetail.hasComment = function (grade) {
            return _.isUndefined(grade.comment) === false && grade.comment !== "null" && grade.comment.length > 0;
        };

        assignDetail.compose = function() {
            $scope.mainNavigator.pushPage('compose.html', {animation: 'slide', hasLMT: true, teachers: assignDetail.course});
        };

    }

    function countZeros(progressReport, utils) {
        var count = 0;
        for (var i = 0, len = progressReport.grades.length; i < len; i++) {
            var grade = progressReport.grades[i];
            if (utils.isTrue(grade.zero) === true) {
                count += 1;
            }
            if(typeof(grade.assignment.dueDate) === "string") {
                grade.assignment.dueDate = Date.parse(grade.assignment.dueDate);
            }
        }
        return count;
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
