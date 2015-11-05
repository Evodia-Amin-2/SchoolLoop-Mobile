(function() {
    'use strict';

    angular.module('ui.components')
        .directive('multiSelect', ['$timeout', function($timeout) {
            return {
                restrict: 'E',
                require: '?ngModel',
                scope: {
                    search: '='
                },
                replace: true,
                link: function(scope, element, attrs, model) {
                    var data = scope.data = {};
                    data.tokens = [];
                    data.results = undefined;
                    data.hasFocus = false;
                    data.loading = undefined;

                    var queryCache = {};

                    var inputList = $(".token-input", element);
                    var inputField = inputList.children()[0];

                    inputField.style.width = element[0].offsetWidth + "px";

                    var load = _.debounce(function() {
                        if(data.loading === undefined) {
                            scope.$apply(function() {
                                data.loading = true;
                            });
                        }
                    }, 350);

                    var search = _.debounce(function(searchTerm) {
                        data.results = undefined;
                        data.loading = undefined;
                        if(searchTerm === "") {
                            return;
                        }
                        var results = queryCache[searchTerm];
                        if(!results) {
                            load();
                            $timeout(function() {
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
                            scope.$apply(function() {
                                data.loading = false;
                                data.results = processResults(results);
                            });
                        }
                    }, 350);

                    scope.updateSearch = function() {
                        search(data.token);
                    };

                    scope.focusInput = function() {
                        data.hasFocus = true;
                        //inputField.style.width = "80px";
                        $timeout(function() {
                            inputField.focus();
                        });
                    };

                    scope.select = function(item) {
                        model.$modelValue.push(item);
                        data.tokens.push(item);
                        data.token = "";
                        data.results = undefined;
                        scope.focusInput();
                    };

                    scope.removeToken = function(item) {
                        data.tokens = _.without(data.tokens, _.findWhere(data.tokens, {id: item.id}));
                        model.$modelValue = _.without(model.$modelValue, _.findWhere(model.$modelValue, {id: item.id}));
                    };

                    function processResults(results) {
                        if(data.tokens.length > 0) {
                            results = _.reject(results, function(a){
                                return _.find(data.tokens, function(b){
                                    return b.id === a.id;
                                });
                            });
                        }
                        return results;
                    }

                    element.on('click', function() {
                        scope.focusInput();
                    });
                },
                templateUrl: 'multi-select.html'
            };
        }]);
})();
