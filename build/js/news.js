(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('NewsController', ['$scope', '$location', 'DataService', 'DataType', 'StorageService', NewsController])
        .controller('NewsDetailController', ['$scope', '$window', '$sce', '$filter', 'StorageService',
            'DataService', 'DataType', NewsDetailController])
    ;

    function NewsController($scope, $location, dataService, DataType, storageService) {
        var newsCtrl = this;

        navigator.analytics.sendAppView('News');

        newsCtrl.news = dataService.list(DataType.NEWS);

        newsCtrl.load = function($done) {
            return dataService.refresh(DataType.NEWS).then(function(result) {
                newsCtrl.news = result;
                storageService.setNews(result);
                $done();
            }, function() {
                $done();
            });
        };

        newsCtrl.isNew = function(item) {
            return item.isNew === true;
        };

        newsCtrl.showNews = function(newsItem) {
            $location.path("main.tabs.news-detail", {newsId: newsItem.iD});
        };

    }

    function NewsDetailController($scope, $window, $sce, $filter, storageService, dataService, DataType) {
        var newsDetail = this;

        newsDetail.newsItem = $scope.newsNavigator.topPage.pushedOptions.newsItem;

        var newsId = newsDetail.newsItem.newsId;
        var news = dataService.list(DataType.NEWS);

        var newsItem = _.findWhere(news, {iD: newsId});
        $scope.newsItem = newsItem;
        $scope.trustedDescription = "";

        if(newsItem) {
            storageService.setVisited(newsItem);

            if(newsItem.description) {
                var description = $filter('replaceUrlFilter')(newsItem.description);
                var school = storageService.getSelectedSchool().domainName;
                description = $filter('replaceSrcFilter')(description, school);
                $scope.trustedDescription = $sce.trustAsHtml(description);

            }
        }

        $scope.openURL = function (link) {
            var url = link.URL;
            if(url.toLowerCase().startsWith("http") === false) {
                var school = storageService.getSelectedSchool().domainName;
                url = "http://" + school + url;
            }
            $window.open(url, '_system', 'location=no,clearcache=yes,clearsessioncache=yes');

        };

        $scope.$on('menu.back', function() {
            $window.history.back();
        });

        $scope.swipeLeft = function() {
            $window.history.back();
        };

        $scope.swipeRight = function() {
            $window.history.back();
        };
    }

})();
