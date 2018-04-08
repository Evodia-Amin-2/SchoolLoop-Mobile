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
            resetTab();
        });

        $scope.newsNavigator.on("prepop", function() {
            resetTab();
        });

        $scope.tabbar.on("prechange", function(event) {
            if (event.index === 0) {
                resetTab();
            }
        });

        $scope.tabbar.on("reactive", function() {
            resetTab();
        });

        utils.setStatusBar("#009688");

        function resetTab() {
            // utils.resetTab($scope.newsNavigator);
            storageService.setBackButtonExit(true);
            utils.setStatusBar("#009688");
        }
    }

    function NewsDetailController($rootScope, $scope, $window, $sce, $filter, storageService, utils) {
        var newsDetail = this;

        var data = $scope.newsNavigator.topPage.data;
        newsDetail.newsItem = data.news;

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

        storageService.setBackButtonExit(false);

        $scope.$on("hardware.backbutton", function() {
            if($scope.mainNavigator.pages.length > 1) {
                $scope.mainNavigator.popPage();
            } else if($scope.newsNavigator.pages.length > 1) {
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
