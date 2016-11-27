(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('NewsController', ['$rootScope', '$scope', '$timeout', 'DataService', 'DataType', 'StorageService', 'Utils', NewsController])
        .controller('NewsDetailController', ['$rootScope', '$scope', '$window', '$sce', '$filter', 'StorageService', 'Utils', NewsDetailController])
    ;

    function NewsController($rootScope, $scope, $timeout, dataService, DataType, storageService, utils) {
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
            utils.resetTab($scope.newsNavigator, "news.html");
        });


        var tabbar = document.querySelector("ons-tabbar");
        tabbar.addEventListener("postchange", function() {
            utils.resetTab($scope.newsNavigator, "news.html");
        });

        tabbar.addEventListener("reactive", function() {
            utils.resetTab($scope.newsNavigator, "news.html");
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

        $scope.$on("hardware.backbutton", function() {
            if($scope.mainNavigator.pages.length > 1) {
                $scope.mainNavigator.popPage();
            } else {
                $scope.newsNavigator.popPage();
            }
        });

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
