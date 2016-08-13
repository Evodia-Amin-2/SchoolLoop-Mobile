/*jshint sub:true*/
(function() {
    'use strict';

    angular.module('app.services')
        .constant('CourseColors', ["#0084b1", "#159501", "#673AB7", "#9C27B0", "#EAB102",
            "#B96113", "#99CEE0", "#A1D59A", "#C2B0E2", "#D7A9DF"])
        .factory('Utils', [Utils])
    ;

    function Utils() {
        var utils = {
            isNull: function(value) {
                return value === null || value === "null";
            },
            isTrue: function(value) {
                return value === true || value === "true";
            }
        };
        return utils;
    }
})();
