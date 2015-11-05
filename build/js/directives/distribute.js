(function() {
    'use strict';

    angular.module('ui.components')
        .directive('distribute', ['$window', '$timeout',
            function($window, $timeout) {
                return {
                    restrict: 'A',
                    link: function(scope, element /*, attrs*/) {

                        function resizeHandler() {
                            //if(device.platform.toLowerCase() === "android" || device.platform.toLowerCase() === "browser") {
                            //    return;
                            //}

                            var children = element.children();
                            var len = children.length;
                            var clientWidth = element[0].clientWidth;
                            var width = Math.ceil(clientWidth / len) - 1;
                            var total = 0;
                            for(var i = 0; i < len; i++) {
                                var el = children[i];
                                if( i < len - 1 ) {
                                    el.style.width =  width + "px";
                                } else {
                                    width = clientWidth - total;
                                    el.style.width =  width + "px";
                                }
                                total += width + 4;
                            }
                        }

                        angular.element($window).bind('resize', function () {
                            resizeHandler();
                        });

                        $timeout(resizeHandler, 200);

                    }
                };
            }
        ]);

})();