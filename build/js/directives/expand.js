(function() {
    'use strict';

    angular.module('ui.components')
        .directive('expand', ['$rootScope', '$window', '$timeout',
            function($rootScope, $window, $timeout) {
                return {
                    restrict: 'A',
                    link: function(scope, element /*, attrs*/) {

                        function resizeHandler() {

                            var offset = 0;

                            var el = element[0];
                            while(el) {
                                offset += el.offsetTop;
                                el = el.offsetParent;
                            }

                            if($window.innerHeight > 200) {
                                var next = element[0].nextElementSibling;
                                if(next) {
                                    offset += next.offsetHeight;
                                }
                            }

                            var marginH = parseInt(element.css("margin-bottom"));
                            if(isNaN(marginH)) {
                                marginH = 0;
                            }
                            var expandedHeight = $window.innerHeight - offset - marginH;

                            $timeout(function() {
                                $(element).height(expandedHeight);
                                $rootScope.$broadcast("expand.height", {"height": expandedHeight});
                            });
                        }

                        angular.element($window).bind('resize', function () {
                            resizeHandler();
                        });

                        $timeout(resizeHandler, 700);

                    }
                };
            }
        ]);

})();