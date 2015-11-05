(function() {
    'use strict';

    angular.module('ui.components').
        directive('scroller', ['$timeout', 'gettextCatalog',
            function($timeout, gettextCatalog) {
                return {
                    restrict: 'A',
                    transclude: true,
                    replace: true,
                    link: function(scope, element) {

                        var container = element[0];
                        var content = container.children[0];
                        var pullToRefresh = content.children[0];
                        var pullText = pullToRefresh.children[0];

                        var scroller = new Scroller(render, {
                            scrollingX: false,
                            bouncing: true
                        });

                        // Activate pull-to-refresh
                        scroller.activatePullToRefresh(50, function() {
                            pullToRefresh.className += " active";
                            pullText.innerHTML = gettextCatalog.getString("Release to Refresh");
                        }, function() {
                            pullToRefresh.className = pullToRefresh.className.replace(" active", "");
                            pullText.innerHTML = gettextCatalog.getString("Pull to Refresh");
                        }, function() {
                            pullToRefresh.className += " running";
                            pullText.innerHTML = gettextCatalog.getString("Refreshing...");

                            scope.pullRefresh().then(function() {
                                finishPull();
                            }, function() {
                                finishPull();
                            });
                        });

                        var rect = container.getBoundingClientRect();
                        scroller.setPosition(rect.left+container.clientLeft, rect.top+container.clientTop);

                        scope.refresh = function() {
                            if(scroller) {
                                scroller.setDimensions(container.clientWidth, container.clientHeight, content.offsetWidth, content.offsetHeight - pullToRefresh.offsetHeight);
                            }
                        };

                        scope.$on('scroll.refresh', function() {
                            scope.refresh();
                        });

                        scope.$on('orientation.change', function() {
                            scope.refresh();
                        });

                        $timeout(function() {
                            scope.refresh();
                        }, 300);

                        if ('ontouchstart' in window) {
                            container.addEventListener("touchstart", function(e) {
                                // Don't react if initial down happens on a form element
                                if (scroller === null || e.target.tagName.match(/input|textarea|select/i)) {
                                    return;
                                }
                                scroller.doTouchStart(e.touches, e.timeStamp);
                            }, false);

                            var lastTouchTop = 0;
                            container.addEventListener("touchmove", function(e) {
                                if(scroller === null) {
                                    return;
                                }

                                var currentTouchTop = e.touches[0].pageY;
                                var delta = currentTouchTop - lastTouchTop;
                                if(scroller.__isDragging) {
                                    lastTouchTop = currentTouchTop;

                                    if(scroller.__scrollTop <= -50 && delta < 0) {
                                        scroller.scrollTo(0, 0, false);
                                        scroller.__scrollTop = 0;
                                        finishPull();
                                    }

                                    if(scroller.__maxScrollTop === 0 && scroller.__scrollTop < -50) {
                                        scroller.__scrollTop = -50;
                                    }
                                }

                                scroller.doTouchMove(e.touches, e.timeStamp);

                                e.preventDefault();
                            }, false);

                            container.addEventListener("touchend", function(e) {
                                if(scroller === null) {
                                    return;
                                }
                                scroller.doTouchEnd(e.timeStamp);
                            }, false);

                        } else {
                            var mousedown = false;

                            container.addEventListener("mousedown", function(e) {
                                // Don't react if initial down happens on a form element
                                if (scroller === null || e.target.tagName.match(/input|textarea|select/i)) {
                                    return;
                                }
                                scroller.doTouchStart([{
                                    pageX: e.pageX,
                                    pageY: e.pageY
                                }], e.timeStamp);

                                mousedown = true;
                            }, false);

                            document.addEventListener("mousemove", function(e) {
                                if (!mousedown) {
                                    return;
                                }

                                scroller.doTouchMove([{
                                    pageX: e.pageX,
                                    pageY: e.pageY
                                }], e.timeStamp);

                                mousedown = true;
                            }, false);

                            document.addEventListener("mouseup", function(e) {
                                if (!mousedown) {
                                    return;
                                }
                                if(scroller === null) {
                                    return;
                                }

                                scroller.doTouchEnd(e.timeStamp);

                                mousedown = false;
                            }, false);

                        }

                        function render(left, top, zoom) {

                            if(_.isUndefined(scope.scrollListener) === false) {
                                scope.scrollListener({top: top, max: scroller.__maxScrollTop});
                            }

                            content.style.WebkitTransform = 'translate3d(' + (-left) + 'px,' + (-top) + 'px,0) scale(' + zoom + ')';
                            content.style.MozTransform = 'translate3d(' + (-left) + 'px,' + (-top) + 'px,0) scale(' + zoom + ')';
                            content.style.transform = 'translate3d(' + (-left) + 'px,' + (-top) + 'px,0) scale(' + zoom + ')';
                        }

                        function finishPull() {
                            if(scroller === null) {
                                return;
                            }
                            scroller.finishPullToRefresh();
                            pullToRefresh.className = "pull-to-refresh";
                        }

                        scope.$on('$destroy', function() {
                            if(scroller) {
                                scroller = null;
                            }
                        });

                    },
                    templateUrl: 'scroller.html'
                };
            }
        ]);
})();