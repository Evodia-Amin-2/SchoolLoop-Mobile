(function() {
    'use strict';

    angular.module('ui.components')
        .directive('dropdown', ['$document', '$timeout',
            function($document, $timeout) {
                return {
                    restrict: 'A',
                    scope: {
                        classmenu: '@',
                        classlink: '@',
                        initial: '@',
                        actions: '=',
                        listener: '='
                    },
                    link: function(scope) {
                        scope.menuStyle = { 'position': 'absolute' };
                        scope.showMenu = false;

                        $timeout(function() {
                            scope.menuActions = scope.actions;
                            if(scope.menuActions) {
                                scope.current = scope.menuActions[scope.initial];
                            }
                        });

                        scope.clickAction = function(index) {
                            scope.current = scope.menuActions[index];

                            scope.listener(index);
                        };

                        scope.toggle = function() {
                            scope.showMenu = !scope.showMenu;
                        };

                        $document.bind('click', function(e) {
                            var hasParent = $(e.target).parents('.loopmail-menu');
                            if(hasParent.length === 0) {
                                scope.showMenu = false;
                                e.stopPropagation();
                                e.preventDefault();
                                return false;
                            }
                        });
                    },
                    templateUrl: 'dropdown.html'
                };
            }
        ]);

})();
