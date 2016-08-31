(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('NewsController', ['$rootScope', '$scope', '$timeout', '$location', 'DataService', 'DataType', 'StorageService', NewsController])
        .controller('NewsDetailController', ['$rootScope', '$scope', '$window', '$sce', '$filter', 'StorageService', 'Utils', NewsDetailController])
    ;

    function NewsController($rootScope, $scope, $timeout, $location, dataService, DataType, storageService) {
        var newsCtrl = this;

        navigator.analytics.sendAppView('News');

        newsCtrl.news = dataService.list(DataType.NEWS);

        newsCtrl.load = function($done) {
            $timeout(function() {
                return dataService.refresh(DataType.NEWS).then(function(result) {
                    newsCtrl.news = result;
                    storageService.setNews(result);
                    $rootScope.$broadcast("update.counter");
                    $done();
                }, function() {
                    $done();
                });
            }, 1000);
        };

        newsCtrl.isNew = function(item) {
            return item.isNew === true;
        };

        $scope.$on("refresh.all", function() {
            newsCtrl.news = dataService.list(DataType.NEWS);
        });

        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("prechange", function() {
            var pages = $scope.newsNavigator.pages;
            if(pages.length > 1) {
                $scope.newsNavigator.popPage();
            }
        });

        tabbar.addEventListener("reactive", function() {
            var pages = $scope.newsNavigator.pages;
            if(pages.length > 1) {
                $scope.newsNavigator.popPage();
            }
        });

    }

    function NewsDetailController($rootScope, $scope, $window, $sce, $filter, storageService, utils) {
        var newsDetail = this;

        newsDetail.newsItem = $scope.newsNavigator.topPage.pushedOptions.news;

        newsDetail.trustedDescription = "";

        if(newsDetail.newsItem) {
            storageService.setVisited(newsDetail.newsItem);
            $rootScope.$broadcast("update.counter");

            if(newsDetail.newsItem.description) {
                var description = $filter('replaceUrlFilter')(newsDetail.newsItem.description);
                var school = storageService.getSelectedSchool().domainName;
                description = $filter('replaceSrcFilter')(description, school);
                newsDetail.trustedDescription = $sce.trustAsHtml(description);
            }
        }

        newsDetail.getDescription = function() {
            if(utils.isNull(newsDetail.newsItem.description) === false) {
                var description = $filter('replaceUrlFilter')(newsDetail.newsItem.description);
                var school = storageService.getSelectedSchool().domainName;
                description = $filter('replaceSrcFilter')(description, school);
                return $sce.trustAsHtml(description);
            }
            return "";
        };


        newsDetail.openURL = function (link) {
            var url = link.URL;
            if(url.toLowerCase().startsWith("http") === false) {
                var school = storageService.getSelectedSchool().domainName;
                url = "http://" + school + url;
            }
            $window.open(url, '_system', 'location=no,clearcache=yes,clearsessioncache=yes');

        };
    }

})();
