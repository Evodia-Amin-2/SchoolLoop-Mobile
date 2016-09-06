(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('CalendarController', ['$scope', '$timeout', 'Utils',
            'DataService', 'DataType', 'CourseColors', CalendarController])
        .controller('CalendarDetailController', ['$scope', '$timeout', '$window', '$sce', 'StorageService',
            'Utils', 'CourseColors', 'gettextCatalog', CalendarDetailController])
    ;

    function CalendarController($scope, $timeout, utils, dataService, DataType, CourseColors) {

        navigator.analytics.sendAppView('Calendar');

        var calendarCtrl = this;

        var today = moment();
        calendarCtrl.title = today.format("MMMM");

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
            if(_.isUndefined(event.scopeNames) === true) {
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
        });

        $scope.calendarNavigator.on("prepop", function() {
            StatusBar.backgroundColorByHexString("#009688");
            StatusBar.show();
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
        }

        function groupEvents(data) {
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

    }

})();
