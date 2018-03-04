/*jshint sub:true*/
(function() {
    'use strict';

    angular.module('app.services')
        .constant('CourseColors', ["#0084b1", "#159501", "#673AB7", "#9C27B0", "#EAB102",
            "#B96113", "#99CEE0", "#A1D59A", "#C2B0E2", "#D7A9DF"])
        .factory('Utils', ['$timeout', Utils])
    ;

    function Utils($timeout) {
        var utils = {
            isNull: function(value) {
                return value === null || value === "null";
            },
            isTrue: function(value) {
                return value === true || value === "true";
            },
            getDisplayDate: function(source, timeZone, gettextCatalog) {
                var sourceDate;
                var today, future;
                if(timeZone) {
                    sourceDate = moment(new Date(Number(source))).tz(timeZone);
                    today = moment().tz(timeZone);
                    future = moment().tz(timeZone);
                } else {
                    sourceDate = moment(new Date(Number(source)));
                    today = moment();
                    future = moment();
                }
                future.add(1, 'days');

                var message;
                if(sourceDate.isSame(today, 'day')) {
                    message = gettextCatalog.getString("Today");
                    return message;
                } else if(sourceDate.isSame(future, 'day')) {
                    message = gettextCatalog.getString("Tomorrow");
                    return message;
                } else {
                    future.add(5, 'days');
                    if(sourceDate.isBefore(future) && sourceDate.isAfter(today)) {
                        return sourceDate.format("dddd");
                    } else {
                        return sourceDate.format("dddd, MMM D, YYYY");
                    }
                }
                return sourceDate.format("dddd, MMM D, YYYY");
            },
            resetTab: function(navigator) {
                var pages = navigator.pages;
                if(pages.length > 1) {
                    navigator.popPage();
                }
            },
            setStatusBar: function(color) {
                $timeout(function () {
                    StatusBar.backgroundColorByHexString(color);
                    StatusBar.show();
                }, 100);
            },
            hasParent: function(element, className) {
                var regex = new RegExp('\\b' + className + '\\b');
                do {
                    if (regex.exec(element.className)) {
                        return true;
                    }
                    element = element.parentNode;
                } while (element);
                return false;
            }

        };
        return utils;
    }
})();
