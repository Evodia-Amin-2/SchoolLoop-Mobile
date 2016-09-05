(function() {
    'use strict';

    angular.module('ui.components')
        .directive('multiSelect', ['$timeout', MultiSelect]);

    function MultiSelect($timeout) {
        return {
            restrict: 'E',
            scope: {
                search: '=',
                values: '=',
                android: '@'
            },
            replace: true,
            link: function (scope, element) {

                var data = scope.data = {};
                data.results = undefined;
                data.hasFocus = false;
                data.loading = undefined;

                var queryCache = {};

                var inputList = $(".token-input", element);
                var inputField = inputList.children()[0];

                var load = _.debounce(function () {
                    if (data.loading === undefined) {
                        scope.$apply(function () {
                            data.loading = true;
                        });
                    }
                }, 350);

                var search = _.debounce(function (searchTerm) {
                    data.results = undefined;
                    data.loading = undefined;
                    if (searchTerm === "") {
                        return;
                    }
                    var results = queryCache[searchTerm];
                    if (!results) {
                        load();
                        $timeout(function () {
                            scope.search(searchTerm).then(
                                function (results) {
                                    queryCache[searchTerm] = results;
                                    data.loading = false;
                                    data.results = processResults(results);
                                },
                                function () {
                                    data.loading = false;
                                    data.results = [];
                                }
                            );
                        });
                    } else {
                        scope.$apply(function () {
                            data.loading = false;
                            data.results = processResults(results);
                        });
                    }
                }, 350);

                scope.updateSearch = function () {
                    search(data.token);
                };

                scope.focusInput = function () {
                    data.hasFocus = true;
                    inputField.focus();
                    $timeout(function () {
                        inputField.focus();
                    });
                };

                scope.loseFocus = function () {
                    $timeout(function () {
                        data.hasFocus = false;
                        data.token = "";
                        data.results = undefined;
                    });
                };

                scope.selectItem = function (item) {
                    scope.values.push(item);
                    data.token = "";
                    data.results = undefined;
                    scope.focusInput();
                };

                scope.removeToken = function (item) {
                    scope.values = _.without(scope.values, _.findWhere(scope.values, {id: item.id}));
                };

                function processResults(results) {
                    if (scope.values.length > 0) {
                        results = _.reject(results, function (a) {
                            return _.find(scope.values, function (b) {
                                return b.id === a.id;
                            });
                        });
                    }
                    return results;
                }

                element.on('click', function () {
                    scope.focusInput();
                });
            },
            templateUrl: 'multi-select.html'
        };
    }
})();
