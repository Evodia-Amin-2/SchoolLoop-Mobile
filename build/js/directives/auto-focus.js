(function() {
    'use strict';

    angular.module('ui.components')
        .directive('autoFocus', ['$timeout', AutoFocus])
    ;

    function AutoFocus($timeout) {
        return {
            restrict: 'A',
            link: function(scope, element, attr) {
                if (attr.ngShow){
                    scope.$watch(attr.ngShow, function(newValue){
                        if(newValue){
                            $timeout(function(){
                                var lookup = $(element);
                                var input = lookup.find('input');
                                input.focus();
                            }, 0);
                        }
                    });
                }
                if (attr.ngHide){
                    scope.$watch(attr.ngHide, function(newValue){
                        if(!newValue){
                            $timeout(function(){
                                var lookup = $(element);
                                var input = lookup.find('input');
                                input.focus();
                            }, 0);
                        }
                    });
                }

            }
        };
    }
})();