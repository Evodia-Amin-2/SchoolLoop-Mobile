(function() {
    'use strict';

    angular.module('ui.components')
        .directive('inputTop', [InputTop])
    ;

    function InputTop() {
        return function(scope, element) {
            element.bind("focus", function() {
                var scroller = $(this).parents(".page__content");
                var top = (element.parent())[0].offsetTop;
                $(scroller).animate({
                    scrollTop: top
                }, 500);
            });
        };
    }
})();
