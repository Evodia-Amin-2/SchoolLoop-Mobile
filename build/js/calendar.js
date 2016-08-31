(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('CalendarController', ['$scope', '$timeout', '$location', 'DataService', 'DataType', 'StorageService', CalendarController])
    ;

    function CalendarController($scope, $timeout, $location, dataService, DataType, storageService) {
        var calendarCtrl = this;

        navigator.analytics.sendAppView('News');

        calendarCtrl.news = dataService.list(DataType.NEWS);

        calendarCtrl.load = function($done) {
            $timeout(function() {
                return dataService.refresh(DataType.NEWS).then(function(result) {
                    calendarCtrl.news = result;
                    storageService.setNews(result);
                    $done();
                }, function() {
                    $done();
                });
            }, 1000);
        };

        calendarCtrl.isNew = function(item) {
            return item.isNew === true;
        };

        $scope.$on("refresh.all", function() {
            calendarCtrl.news = dataService.list(DataType.NEWS);
        });
    }

})();
