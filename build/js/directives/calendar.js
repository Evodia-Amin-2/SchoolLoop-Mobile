(function() {
    'use strict';

    angular.module('ui.components')
        .directive('calendar', [Calendar]);

    function Calendar() {
        return {
            restrict: 'E',
            scope: {
                selected: "=",
                set: "="
            },
            templateUrl: 'calendar-directive.html',
            link: function(scope) {
                scope.selected = (scope.selected || moment());
                scope.weekdays = moment.weekdaysShort();

                function initialize() {
                    var start = scope.selected.clone();
                    start.date(1);
                    _removeTime(start.day(0));

                    scope.month = scope.selected.clone();
                    _buildMonth(scope, start, scope.month);
                }

                initialize();

                scope.select = function(day) {
                    scope.set(day.date);
                };

                scope.today = function() {
                    scope.set(moment());
                };

                scope.$watch('selected',
                    function() {
                        initialize();
                    }
                );

                scope.next = function() {
                    var next = scope.month.clone();
                    _removeTime(next.month(next.month()+1).date(1));
                    scope.month.month(scope.month.month()+1);
                    _buildMonth(scope, next, scope.month);
                };

                scope.previous = function() {
                    var previous = scope.month.clone();
                    _removeTime(previous.month(previous.month()-1).date(1));
                    scope.month.month(scope.month.month()-1);
                    _buildMonth(scope, previous, scope.month);
                };

                scope.$on('swipe.left', function() {
                    scope.next();
                    scope.$apply();
                });

                scope.$on('swipe.right', function() {
                    scope.previous();
                    scope.$apply();
                });

            }
        };

        function _removeTime(date) {
            return date.day(0).hour(0).minute(0).second(0).millisecond(0);
        }

        function _buildMonth(scope, start, month) {
            scope.weeks = [];
            var done = false, date = start.clone(), monthIndex = date.month(), count = 0;
            while (!done) {
                scope.weeks.push({ days: _buildWeek(date.clone(), month) });
                date.add(1, "w");
                done = count++ > 2 && monthIndex !== date.month();
                monthIndex = date.month();
            }
        }

        function _buildWeek(date, month) {
            var days = [];
            for (var i = 0; i < 7; i++) {
                days.push({
                    name: date.format("dd").substring(0, 1),
                    number: date.date(),
                    isCurrentMonth: date.month() === month.month(),
                    isToday: date.isSame(moment(), "day"),
                    date: date
                });
                date = date.clone();
                date.add(1, "d");
            }
            return days;
        }
    }
})();
