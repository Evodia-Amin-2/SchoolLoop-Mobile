(function() {
    'use strict';

    angular.module('ui.components')
        .directive('ngEnter', [NgEnter])
    ;

    function NgEnter() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                    scope.$apply(function() {
                        scope.$eval(attrs.ngEnter, {'event': event});
                    });

                    event.preventDefault();
                }
            });
        };
    }
})();
