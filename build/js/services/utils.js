/*jshint sub:true*/
(function() {
    'use strict';

    angular.module('app.services')
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
