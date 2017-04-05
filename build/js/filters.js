(function() {
    'use strict';

    angular.module('ui.components')
        .filter('isEmpty', [function() {
            return function (input, replaceText) {
                if (!input || input === 'null') {
                    return replaceText;
                }
                return input;
            };
        }])
        .filter('percent', ['$filter', function($filter) {
            return function (input, decimals) {
                input = input || 0;
                return $filter('number')(input * 100, decimals) + '%';
            };
        }])
        .filter('truncate', [function () {
            return function (input, length) {
                if (isNaN(length)) {
                    return input;
                }
                return input.substring(0, length);
            };
        }])
        .filter('characters', [function () {
            return function (input, chars, breakOnWord) {
                if (isNaN(chars)) {
                    return input;
                }
                if (chars <= 0) {
                    return '';
                }
                if (input && input.length >= chars) {
                    input = input.substring(0, chars);

                    if (!breakOnWord) {
                        var lastspace = input.lastIndexOf(' ');
                        //get last space
                        if (lastspace !== -1) {
                            input = input.substr(0, lastspace);
                        }
                    } else {
                        while (input.charAt(input.length - 1) === ' ') {
                            input = input.substr(0, input.length - 1);
                        }
                    }
                    return input + '...';
                }
                return input;
            };
        }])
        .filter('replaceUrlFilter', [function () {
            var hrefPattern = /href=(["]*)([^"]*)(["]*)/gi;
            return function (text) {
                if(!text) {
                    return text;
                }
                angular.forEach(text.match(hrefPattern), function (href) {
                    text = replaceLink(text, href, "", "browse");
                });
                return text;
            };
        }])
        .filter('replaceSrcFilter', [function () {
            var hrefPattern = /src=(["]*)([^"]*)(["]*)/gi;
            return function (text, school) {
                if(!text) {
                    return text;
                }
                angular.forEach(text.match(hrefPattern), function (href) {
                    var url = href.substring(5);
                    if(url.startsWith("http") === false) {
                        var newLink = "src=\"http://" + school + url;
                        text = text.replace(href, newLink);
                    }
                });

                return text;
            };
        }])
        .filter('momentTz', [function() {
            return function (rawDate, format, timeZone) {
                if(_.isUndefined(rawDate)) {
                    return "";
                }
                var ts = moment(new Date(Number(rawDate))).tz(timeZone);
                return ts.format(format);
            };
        }])
        .filter('moment', [function() {
            return function (rawDate, format) {
                if(_.isUndefined(rawDate)) {
                    return "";
                }
                var ts = moment(new Date(rawDate));
                return ts.format(format);
            };
        }])
        .filter('decimal', [function() {
            return function (input, places) {
                if (isNaN(input)) {
                    return input;
                }
                // If we want 1 decimal place, we want to mult/div by 10
                // If we want 2 decimal places, we want to mult/div by 100, etc
                var num = Number(places);
                var factor = "1" + Array(+(num > 0 && num + 1)).join("0");
                return Math.round(input * factor) / factor;
            };
        }])
        .filter('decodeScore', [function() {
            return function (input) {
                if(_.isUndefined(input)) {
                    return "";
                }
                return decodeURIComponent(input);
            };
        }])
    ;

    function replaceLink(text, href, school, method) {
        var url = href.substring("href=".length);
        var start = 0;
        if(url.startsWith('"')) {
            start = 1;
        }
        var end = 0;
        if(url.endsWith('"')) {
            end = url.length - 1;
        }
        var link = url.substring(start, end);

        if(link.toLowerCase().startsWith("http") === false && link.toLowerCase().startsWith("mail") === false) {
            link = "http://" + school + link;
        }

        var newlink = "ng-href=\"#\" onclick='" + method + "(\"" + link + "\");'";
        text = text.replace(href, newlink);
        return text;
    }

})();
