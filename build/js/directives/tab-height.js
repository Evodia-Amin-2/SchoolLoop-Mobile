(function() {
    'use strict';

    angular.module('ui.components')
        .directive('tabHeight', [
            function() {
                return {
                    restrict: 'A',
                    link: function(scope/*, element, attrs*/) {
                        scope.$on("expand.height", function() {
                            //scope.$apply(resizeHandler);
                        });

                        scope.$on('orientation.change', function() {
                            scope.$apply(resizeHandler);
                        });

                        function resizeHandler() {
                            var tabHolder = $(".tab-holder");
                            var height = window.innerHeight;
                            var top = tabHolder.offset().top;
                            $(tabHolder).height(height - top);
                        }

                    }
                };
            }
        ]);

})();