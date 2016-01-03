(function () {
    'use strict';

    angular.module('ui.components')
        .directive('tabs', ['$state', '$timeout', 'NavbarService',
            function($state, $timeout, navbarService) {
                return {
                    restrict: 'E',
                    replace: true,
                    transclude: true,
                    controller: function($scope) {
                        $scope.src = '';
                        $scope.selectedIndex = 0;

                        var tabs = $scope.tabs = [];
                        var controller = this;

                        controller.addTab = function (tab, selected) {
                            tab.selected = selected;
                            tab.index = tabs.length;
                            tabs.push(tab);
                        };

                        controller.selectTab = function (tab) {
                            $scope.slideDirection = "slide-left";
                            if($scope.selectedIndex > tab.index) {
                                $scope.slideDirection = "slide-right";
                            }

                            tabs[$scope.selectedIndex].selected = false;
                            $scope.selectedIndex = tab.index;
                            tab.selected = true;

                            $timeout(function() {
                                    $state.go(tab.src);
                                }
                            );
                        };

                        $scope.$on("$stateChangeSuccess", function(event, toState /*, toParams, fromState, fromParams */) {
                            $timeout(function() {
                                var paths = toState.name.split(".");
                                var selectedTab = false;
                                tabs.forEach(function(tab) {
                                    var src = tab.src;
                                    var isSrc = $state.is(src);
                                    var selected = isSrc || inPath(src, paths);
                                    if(selected) {
                                        selectedTab = tab;
                                        $scope.selectedIndex = tab.index;
                                        var title = tab.title;
                                        if(isSrc === true) {
                                            navbarService.setTitle(title);
                                            navbarService.setBackEnabled(false);
                                        }
                                    }
                                    tab.selected = selected;
                                });
                            });
                        });


                        $scope.swipeRight = function() {
                            var index = $scope.selectedIndex;
                            if(index > 0) {
                                controller.selectTab(tabs[index - 1]);
                            }
                        };

                        $scope.swipeLeft = function() {
                            var index = $scope.selectedIndex;
                            if(index < tabs.length - 1) {
                                controller.selectTab(tabs[index + 1]);
                            }
                        };

                        function inPath(src, paths) {
                            var srcPaths = src.split(".");
                            for(var i = 0, len = srcPaths.length; i < len; i++) {
                                if(!paths[i] || paths[i].indexOf(srcPaths[i]) < 0) {
                                    return false;
                                }
                            }
                            return true;
                        }
                    },
                    template:
                        '<div class="tab-holder"> \
                            <div class="tab-panel" ng-class="slideDirection" ui-view></div>\
                            <div class="tabs" ng-transclude distribute=""></div>\
                        </div>'
                };

            }
        ])
        .directive('tabPane', [
            function() {
                return {
                    restrict: 'E',
                    replace: true,
                    require: '^tabs',
                    scope: {
                        title: '@',
                        image: '@',
                        badge: '@',
                        count: '=',
                        src: '@'
                    },
                    link: function(scope, element, attrs, tabsController) {
                        tabsController.addTab(scope, attrs.selected === "true");

                        scope.select = function () {
                            tabsController.selectTab(scope);
                        };

                        scope.$safeApply = function (fn) {
                            var phase = scope.$root.$$phase;
                            if (phase === '$apply' || phase === '$digest') {
                                if (fn && (typeof(fn) === 'function')) {
                                    fn();
                                }
                            } else {
                                scope.$apply(fn);
                            }
                        };
                    },
                    template:
                        '<div class="tab" ng-click="select()" ng-class="{selected: selected}">\
                            <div class="tab-icon">\
                                <img ng-src="img/{{image}}" alt="{{title}}"/>\
                            </div>\
                            <div class="tab-title">\
                                <div class="title-text">{{title}}</div>\
                                <div ng-show="badge && count > 0" class="icon-badge">{{count}}</div>\
                            </div>\
                            <div class="tab-selected" ng-show="selected"></div>\
                        </div>'
                };
            }
        ])
    ;
})();

