(function() {
    'use strict';

    angular.module('ui.components')
        .directive('counter', ['$compile', '$templateCache', Counter])
    ;

    function Counter($compile, $templateCache) {
        return {
            restrict: "AE",
            scope: {
                counter: "="
            },
            link: function(scope, element) {
                var template = $templateCache.get('counter.html');
                scope.count = scope.counter();
                var result = $compile(template)(scope);
                element.append(result);

                scope.$on('update.counter', function() {
                    scope.count = scope.counter();
                });

            }
        };
    }
})();
