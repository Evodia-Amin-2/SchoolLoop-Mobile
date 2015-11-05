(function() {
    'use strict';

    angular.module('ui.components')
        .directive('lookup', ['$timeout', function($timeout) {
            return {
                restrict: 'A',
                require: '?ngModel',
                scope: true,
                replace: true,
                link: function(scope, element, attrs, model) {
                    var opts = angular.extend({}, scope.$eval(attrs.lookup));

                    scope.placeholder = attrs.placeholder;
                    scope.lookup = scope.lookup || {};
                    scope.lookup.isExpanded = false;
                    scope.lookup.currentPage = 0;
                    scope.lookup.itemsPerPage = 20;
                    scope.lookup.displaySet = [];

                    opts.load(scope.lookup);

                    if(_.isUndefined(model.$modelValue[0]) === false) {
                        scope.selected(model.$modelValue[0]);
                    }

                    scope.select = function(item) {
                        model.$modelValue[0] = item;
                        scope.lookup.selected = item.name;
                        scope.lookup.isExpanded = false;
                    };

                    scope.expand = function() {
                        scope.lookup.isExpanded = true;
                    };

                    scope.clear = function() {
                        //clearDisplaySet();
                        scope.lookup.isExpanded = false;
                        scope.lookup.selected = "";
                        model.$modelValue.length = 0;
                    };

                    scope.showResults = function() {
                        return scope.lookup.isExpanded;
                    };

                    scope.showClear = function() {
                        return scope.lookup.selected || model.$modelValue[0] || scope.lookup.isExpanded;
                    };

                    element.find('.lookup-content').bind("scroll", function(e) {
                        var elem = $(e.currentTarget);
                        var pos = elem[0].scrollHeight - elem.scrollTop();
                        if(pos <= elem.outerHeight()) {
                            scope.lookup.currentPage++;
                            $timeout(function() {
                                loadData();
                            });
                        }
                    });

                    function loadData() {
                        if(_.isUndefined(scope.lookup.data) === true) {
                            return;
                        }
                        var start = scope.lookup.currentPage * scope.lookup.itemsPerPage;
                        var end = start + scope.lookup.itemsPerPage;
                        var results = scope.lookup.data;
                        var i, len, item, queryRegExp = null;
                        if(isSearchDefined()) {
                            results = [];
                            queryRegExp = RegExp(scope.lookup.selected, 'i'); //'i' -> case insensitive
                            for(i = start, len = scope.lookup.data.length; i < len; i++) {
                                item = scope.lookup.data[i];
                                if(item.name.match(queryRegExp) || item.districtName.match(queryRegExp)) {
                                    results.push(item);
                                }
                                if(results.length > end) {
                                    break;
                                }
                            }
                        }
                        for(i = start, len = results.length; i < len && i < end; i++) {
                            item = results[i];
                            scope.lookup.displaySet.push(item);
                        }
                        if(scope.lookup.displaySet.length === 1) {
                            scope.select(scope.lookup.displaySet[0]);
                        }
                    }

                    function isSearchDefined() {
                        return _.isUndefined(scope.lookup.selected) === false && scope.lookup.selected.length > 0;
                    }

                    function clearDisplaySet() {
                        scope.lookup.displaySet = [];
                        scope.lookup.currentPage = 0;
                        $('.lookup-content').scrollTop(0);
                    }

                    scope.$watch('lookup.selected', function(newValue /*, oldValue */) {
                        if(_.isUndefined(model.$modelValue[0]) === false) {
                            if(newValue && newValue !== model.$modelValue[0].name) {
                                model.$modelValue.length = 0;
                                scope.lookup.isExpanded = newValue.length > 0;
                            } else {
                                scope.lookup.isExpanded = false;
                            }
                        } else {
                            scope.lookup.isExpanded = isSearchDefined();
                        }
                        clearDisplaySet();
                        loadData();
                    });

                    scope.$watch('lookup.isExpanded', function(newValue, oldValue) {
                        if(newValue === true && newValue !== oldValue) {
                            clearDisplaySet();
                            loadData();
                        }
                    });

                    scope.$watch(attrs.ngModel, function(newValue /*, oldValue */) {
                        if(_.isUndefined(newValue[0]) === false) {
                            scope.lookup.selected = newValue[0].name;
                            scope.lookup.isExpanded = false;
                        } else {
                            scope.lookup.selected = "";
                        }
                    }, true);

                },
                templateUrl: 'lookup.html'
            };
        }]);
})();
