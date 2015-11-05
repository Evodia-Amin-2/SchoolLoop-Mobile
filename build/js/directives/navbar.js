(function() {
    'use strict';

    angular.module('ui.components')
        .directive('navbar', ['$rootScope', '$window', '$timeout', 'gettextCatalog', 'StorageService', 'NavbarService',
            function($rootScope, $window, $timeout, gettextCatalog, storageService, navbarService) {
                return {
                    restrict: 'AE',
                    scope: true,
                    replace: true,
                    link: function(scope /*, element, attrs*/) {

                        scope.navbar = navbarService;

                        scope.replyActions = [
                            {action:"reply", label:gettextCatalog.getString('Reply')},
                            {action:"replyall", label:gettextCatalog.getString('Reply All')}
                        ];

                        scope.loopActions = [
                            {action:"inbox", label:gettextCatalog.getString('Inbox')},
                            {action:"sent", label:gettextCatalog.getString('Sent')},
                            {action:"outbox", label:gettextCatalog.getString('Outbox')}
                        ];

                        scope.toggleMenu = function() {
                            $rootScope.$broadcast("menu.toggle");
                        };

                        scope.back = function() {
                            $timeout(function() {
                                $rootScope.$broadcast("menu.back");
                            });
                        };

                        scope.titleBack = function() {
                            if(navbarService.isBackEnabled()) {
                                scope.back();
                            }
                        };

                        scope.cancel = function() {
                            $rootScope.$broadcast("menu.cancel");
                        };

                        scope.loopmail = function() {
                            $rootScope.$broadcast("menu.loopmail");
                        };

                        scope.send = function() {
                            $rootScope.$broadcast("menu.send");
                        };

                        scope.done = function() {
                            $rootScope.$broadcast("menu.done");
                        };

                        scope.menuListener = function(index) {
                            $rootScope.$broadcast("menu.dropdown", {"index": index});
                        };

                        scope.isTeacher = function() {
                            var domain = storageService.getDefaultDomain();
                            return (domain && domain.user && domain.user.role === 'teacher');
                        };
                    },
                    templateUrl: 'navbar.html'
                };
            }
        ]);
})();