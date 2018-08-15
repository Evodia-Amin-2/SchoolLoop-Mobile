(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('CalendarController', ['$scope', '$timeout', 'Utils',
            'DataService', 'StorageService', 'DataType', 'CourseColors', CalendarController])
        .controller('CalendarDetailController', ['$scope', '$timeout', '$filter', '$window', '$sce', 'StorageService',
            'Utils', 'CourseColors', 'gettextCatalog', CalendarDetailController])
    ;

    function CalendarController($scope, $timeout, utils, dataService, storageService, DataType, CourseColors) {

        navigator.analytics.sendAppView('Calendar');

        var calendarCtrl = this;

        var months = moment.months();
        setDay(moment());
        calendarCtrl.today = moment().date();
        calendarCtrl.showCalendar = false;
        calendarCtrl.loaded = false;

        initialize();

        calendarCtrl.isAssignment = function(event) {
            return event.eventType === "assigned" || event.eventType === "due";
        };

        calendarCtrl.courseColor = function(event) {
            if(_.isUndefined(event.periods) === true) {
                return "";
            }
            if(event.eventType === "assigned") {
                return "assigned-color";
            } else {
                var period = event.periods[0];
                var periodIndex = period % CourseColors.length;
                return "period-" + periodIndex;
            }
        };

        calendarCtrl.period = function(event) {
            if(_.isUndefined(event.periods) === true) {
                return "";
            }
            var period = event.periods[0];
            return period;
        };

        calendarCtrl.displayDate = function(event) {
            if(event.allDay !== true) {
                return event.startTimeString + "-" + event.endTimeString;
            }
            return;
        };

        calendarCtrl.toggleCalendar = function() {
            calendarCtrl.showCalendar = ! calendarCtrl.showCalendar;
        };

        calendarCtrl.set = function(date) {
            calendarCtrl.showCalendar = false;

            setDay(date);

            calendarCtrl.events = [];
            dataService.getEvents(date).then(function(result) {
                calendarCtrl.events = groupEvents(result, $scope);
            });
        };

        function setDay(day) {
            calendarCtrl.day = day;
            var month = calendarCtrl.day.month();
            calendarCtrl.title = months[month];
        }

        calendarCtrl.filter = function() {
            $scope.calFilterModal.show();
        };

        $scope.$on('filter.action', function(event, data) {
            $scope.calFilterModal.hide();

            if(data.action === "close") {
                return;
            }

            calendarCtrl.loaded = false;
            calendarCtrl.events = [];
            $timeout(function() {
                var events = dataService.list(DataType.CALENDAR);
                calendarCtrl.events = groupEvents(events, $scope);
            }, 300);

        });

        calendarCtrl.load = function($done) {
            $timeout(function() {
                return dataService.refresh(DataType.CALENDAR).then(function(result) {
                    calendarCtrl.events = groupEvents(result, $scope);
                    $done();
                }, function() {
                    $done();
                });
            }, 1000);
        };

        calendarCtrl.typeLabel = function(item) {
            if(_.isUndefined(item) === true) {
                return "";
            }
            if(item.eventType === "due") {
                return "Due";
            } else {
                return "Assignment";
            }
        };

        $scope.$on("refresh.all", function() {
            initialize();
            // utils.resetTab($scope.calendarNavigator, "calendar.html");
        });

        $scope.calendarNavigator.on("prepop", function() {
            // utils.setStatusBar("#009688");
            // storageService.setBackButtonExit(true);
        });

        // var tabbar = document.querySelector("ons-tabbar");
        // tabbar.addEventListener("postchange", function() {
        //     // utils.resetTab($scope.calendarNavigator, "calendar.html");
        // });
        //
        // tabbar.addEventListener("reactive", function() {
        //     utils.resetTab($scope.calendarNavigator, "calendar.html");
        // });

        function initialize() {
            var events = dataService.list(DataType.CALENDAR);
            calendarCtrl.events = groupEvents(events, $scope);

            utils.setStatusBar("#009688");
        }

        function getCourseName(event) {
            if(_.isUndefined(event.scopeNames) === true || event.scopeNames.length === 0) {
                return "";
            }
            var course = event.scopeNames[0].split(" Period ")[0];
            return course;
        }

        function groupEvents(data) {
            if(_.isUndefined(data) === true) {
                return [];
            }

            var i, len;
            var filtered = [];
            for(i = 0, len = data.length; i < len; i++) {
                var value = data[i];
                if(value.eventType === "assigned") {
                    value.endDay = value.startDay;
                }
                value.courseName = getCourseName(value);
                if(applyFilter(value) === true) {
                    filtered.push(value);
                }
            }

            var sortedData = _.sortBy(filtered, function(o) {
                return o.endDay + " " + o.endTimeString;
            });

            var dates = _.groupBy(sortedData, 'endDay');
            var events = [];
            var keys = Object.keys(dates);
            for(i = 0, len = keys.length; i < len; i++) {
                var object = {};
                object.date = keys[i];
                var sourceDate = moment(object.date);
                if(i === 0 && sourceDate.isAfter(calendarCtrl.day, "day") === true) {
                    object.day = calendarCtrl.day.get('date');
                    object.dow = calendarCtrl.day.format('ddd');
                    object.list = [];
                    events.push(object);
                    object = {};
                }
                object.day = sourceDate.get('date');
                object.dow = sourceDate.format('ddd');
                object.list = dates[keys[i]];
                events.push(object);
            }
            calendarCtrl.loaded = true;
            return events;
        }

        function applyFilter(element) {
            var eventType = element.eventType;
            if(eventType === "assigned") {
                return $scope.calFilter.assigned === true;
            }
            if(eventType === "due") {
                return $scope.calFilter.due === true;
            }
            if(eventType === "school") {
                return $scope.calFilter.general === true;
            }
            if(eventType === "group") {
                return $scope.calFilter.group === true;
            }
            return true;
        }
    }

    function CalendarDetailController($scope, $timeout, $filter, $window, $sce, storageService, utils, CourseColors, gettextCatalog) {
        var calendarDetail = this;

        var data = $scope.calendarNavigator.topPage.data;
        calendarDetail.event = data.event;

        calendarDetail.isAssignment = function(event) {
            return event.eventType === "assigned" || event.eventType === "due";
        };

        calendarDetail.courseColor = function() {
            if(_.isUndefined(calendarDetail.event) === true) {
                return "default-toolbar";
            }
            if(calendarDetail.event.eventType === "due" || calendarDetail.event.eventType === "assigned") {
                var period = calendarDetail.event.periods[0];
                var periodIndex = period % CourseColors.length;
                return "period-" + periodIndex;
            }
            return "default-toolbar";
        };

        calendarDetail.getDescription = function() {
            if(_.isUndefined(calendarDetail.event) === false && utils.isNull(calendarDetail.event.description) === false) {
                var description = $filter('replaceUrlFilter')(calendarDetail.event.description);
                var school = storageService.getSelectedSchool().domainName;
                description = $filter('replaceSrcFilter')(description, school);
                return $sce.trustAsHtml(description);
            }
            return "";
        };

        calendarDetail.hasDescription = function() {
            return _.isUndefined(calendarDetail.event.description) === false || _.isUndefined(calendarDetail.event.links) === false;
        };

        calendarDetail.getDate = function (source, timeZone) {
            return utils.getDisplayDate(source, timeZone, gettextCatalog);
        };

        calendarDetail.openURL = function (link) {
            var url = link.URL;
            if(url.toLowerCase().startsWith("http") === false) {
                var school = storageService.getSelectedSchool().domainName;
                url = "http://" + school + url;
            }
            cordova.InAppBrowser.open(url, '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');

        };

        calendarDetail.hasCoTeacher = function(item) {
            return _.isUndefined(item.coTeacherName) === false && utils.isNull(item.coTeacherName) === false;
        };

        calendarDetail.compose = function() {
            $scope.mainNavigator.pushPage('compose.html', {data:{hasLMT: true, teachers: calendarDetail.event}});
        };

        calendarDetail.openURL = function (link) {
            var url = link.URL;
            if(url.toLowerCase().startsWith("http") === false) {
                var school = storageService.getSelectedSchool().domainName;
                url = "http://" + school + url;
            }
            cordova.InAppBrowser.open(url, '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');
        };

        function setStatusBar() {
            if(calendarDetail.isAssignment(calendarDetail.event)) {
                var period = +calendarDetail.event.periods[0];
                var periodIndex = period % CourseColors.length;
                utils.setStatusBar(CourseColors[periodIndex]);
            } else {
                utils.setStatusBar("#009688");
            }
        }

        $scope.mainNavigator.on("prepop", function(event) {
            var navigator = event.navigator;
            if(navigator.pages.length === 2) {
                var page = navigator.pages[1];
                if(page.name === "compose.html") {
                    $timeout(function() {
                        $scope.calendarNavigator.pages[1].backButton.style.display = "block";
                    });
                }
                setStatusBar();
            }
        });

        storageService.setBackButtonExit(false);

        $scope.$on("hardware.backbutton", function() {
            if($scope.mainNavigator.pages.length > 1) {
                $scope.mainNavigator.popPage();
            } else if($scope.calendarNavigator.pages.length > 1) {
                $scope.calendarNavigator.popPage();
            }
        });

        setStatusBar();
    }

})();
