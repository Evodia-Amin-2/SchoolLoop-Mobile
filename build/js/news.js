(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('NewsController', ['$scope', '$state', 'DataService', 'DataType', 'NavbarService', NewsController])
        .controller('NewsDetailController', ['$rootScope', '$scope', '$window', '$stateParams', '$sce', '$filter', 'StorageService',
            'DataService', 'DataType', 'NavbarService', NewsDetailController])
    ;

    function NewsController($scope, $state, dataService, DataType, navbarService) {

        navigator.analytics.sendAppView('News');

        $scope.news = dataService.list(DataType.NEWS);

        $scope.parentScope = $scope;

        navbarService.reset();

        $scope.pullRefresh = function() {
            return dataService.refresh(DataType.NEWS).then(function(result) {
                $scope.news = result;
                return result;
            }, function(error) {
                return error;
            });
        };

        $scope.isNew = function(item) {
            return item.isNew === true;
        };

        $scope.showNews = function(newsItem) {
            $state.go("main.tabs.news-detail", {newsId: newsItem.iD});
        };

    }

    function NewsDetailController($rootScope, $scope, $window, $stateParams, $sce, $filter, storageService, dataService, DataType, navbarService) {
        var newsId = $stateParams.newsId;
        var news = dataService.list(DataType.NEWS);

        var newsItem = _.findWhere(news, {iD: newsId});
        $scope.newsItem = newsItem;
        $scope.trustedDescription = "";

        navbarService.reset();
        navbarService.setBackEnabled(true);

        if(newsItem) {
            navbarService.setTitle(newsItem.title);

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
