(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('CalendarController', ['$scope', '$timeout', 'Utils',
            'DataService', 'StorageService', 'DataType', 'CourseColors', CalendarController])
        .controller('CalendarDetailController', ['$scope', '$timeout', '$window', '$sce', 'StorageService',
            'Utils', 'CourseColors', 'gettextCatalog', CalendarDetailController])
    ;

    function CalendarController($scope, $timeout, utils, dataService, storageService, DataType, CourseColors) {

        navigator.analytics.sendAppView('Calendar');

        var calendarCtrl = this;

        var months = moment.months();
        setDay(moment());
        calendarCtrl.today = moment().date();
        calendarCtrl.showCalendar = false;

        initialize();

        calendarCtrl.isAssignment = function(event) {
            return event.eventType === "assigned" || event.eventType === "due";
        };

        calendarCtrl.courseColor = function(event) {
            if(_.isUndefined(event.periods) === true) {
                return "";
            }
            var period = event.periods[0];
            var periodIndex = period % CourseColors.length;
            return "period-" + periodIndex;
        };

        calendarCtrl.period = function(event) {
            if(_.isUndefined(event.periods) === true) {
                return "";
            }
            var period = event.periods[0];
            return period;
        };

        calendarCtrl.course = function(event) {
            if(_.isUndefined(event.scopeNames) === true || event.eventType !== "due") {
                return "";
            }
            var course = event.scopeNames[0].split(" Period ")[0];
            return course;
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

        $scope.$on('filter.action', function() {
            $scope.calFilterModal.hide();
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

        $scope.$on("refresh.all", function() {
            initialize();
            utils.resetTab($scope.calendarNavigator, "calendar.html");
        });

        $scope.calendarNavigator.on("prepop", function() {
            utils.setStatusBar("#009688");
            storageService.setBackButtonExit(true);
        });

        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("postchange", function() {
            utils.resetTab($scope.calendarNavigator, "calendar.html");
        });

        tabbar.addEventListener("reactive", function() {
            utils.resetTab($scope.calendarNavigator, "calendar.html");
        });

        function initialize() {
            var events = dataService.list(DataType.CALENDAR);
            calendarCtrl.events = groupEvents(events, $scope);

            utils.setStatusBar("#009688");
        }

        function groupEvents(data) {
            if(_.isUndefined(data) === true) {
                return [];
            }

            var filtered = [];
            for(var i = 0, len = data.length; i < len; i++) {
                if(data[i].eventType === 'assigned') {
                    continue;
                }
                filtered.push(data[i]);
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
                object.day = sourceDate.get('date');
                object.dow = sourceDate.format('ddd');
                object.list = dates[keys[i]];
                events.push(object);
            }
            return events;
        }
    }

    function CalendarDetailController($scope, $timeout, $window, $sce, storageService, utils, CourseColors, gettextCatalog) {
        var calendarDetail = this;

        calendarDetail.event = $scope.calendarNavigator.topPage.pushedOptions.event;

        calendarDetail.getDescription = function() {
            if(utils.isNull(calendarDetail.event.description) === false) {
                return $sce.trustAsHtml(calendarDetail.event.description);
            }
            return "";
        };

        calendarDetail.hasDescription = function() {
            return _.isUndefined(calendarDetail.event.description) === false && _.isUndefined(calendarDetail.event.links) === false;
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
            $window.open(url, '_system', 'location=yes,clearcache=yes,clearsessioncache=yes');

        };

        storageService.setBackButtonExit(false);

        $scope.$on("hardware.backbutton", function() {
            if($scope.mainNavigator.pages.length > 1) {
                $scope.mainNavigator.popPage();
            } else if($scope.calendarNavigator.pages.length > 1) {
                $scope.calendarNavigator.popPage();
            }
        });
    }

})();
