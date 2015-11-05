(function() {
    'use strict';

    angular.module('ui.components')
        .directive('tabHeight', [
            function() {
                return {
                    restrict: 'A',
                    link: function(scope, element /*, attrs*/) {
                        scope.$on("expand.height", function() {
                            scope.$apply(resizeHandler);
                        });

                        function resizeHandler() {
                            var tabHolder = $(element).parents(".tab-holder");
                            var tabsHeight = $('.tabs', tabHolder).height();
                            var tabPanelHeight = tabHolder.height() - tabsHeight;

                            $(element).height(tabPanelHeight);
                        }

                    }
                };
            }
        ]);

})();