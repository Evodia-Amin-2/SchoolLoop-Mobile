(function() {
    'use strict';

    angular.module('ui.components')
        .directive('listNav', [
            function() {
                return {
                    restrict: 'AE',
                    replace: true,
                    template:
                        '<div class="item-nav">\
                            <span class="icon-chevron-right large"></span>\
                        </div>'
                };
            }
        ])
    ;

})();
