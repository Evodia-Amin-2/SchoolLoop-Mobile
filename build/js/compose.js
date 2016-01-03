(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ComposeController', ['$scope', '$window', '$q', '$timeout', 'NavbarService', 'DataService', 'LoopmailService', 'StorageService', '$stateParams', 'gettextCatalog', ComposeController])
        .filter('propsFilter', [PropsFilter])
        ;

        function ComposeController($scope, $window, $q, $timeout, navbarService, dataService, loopmailService, storageService, $stateParams, gettextCatalog) {
            var compose = this;

            navbarService.reset();
            navbarService.setEditMode(true);
            navbarService.setSendEnabled(true);
            navbarService.setTitle(gettextCatalog.getString("New LoopMail"));

            compose.toList = [];
            compose.ccList = [];
            compose.subject = "";
            compose.body = "";
            compose.hasLMT = false;
            compose.addLMT = false;
            compose.isTeacher = false;

            $scope.multipleDemo = {};
            $scope.multipleDemo.selectedPeopleSimple = [];

            var recipients = loopmailService.getRecipients();
            if(!recipients) { // not a detail page - load learning team
                if(isTeacher()) {
                    compose.isTeacher = true;
                    compose.hasLMT = true;
                } else {
                    compose.hasLMT = true;
                    compose.loading = true;
                    $timeout(function() {
                        compose.toList = [];
                        loadLearningTeam(compose.toList);
                    });
                }
            } else {
                compose.toList = recipients;
            }

            compose.searchContacts = function(search) {
                var deferred = $q.defer();

                dataService.getContacts(search).then(
                    function(data) {
                        deferred.resolve(data);
                    },
                    function(error) {
                        deferred.reject(error);
                    }
                );

                return deferred.promise;
            };

            function loadLearningTeam(recipientList, duplicateList) {
                dataService.getStudentLoop().then(function(data) {
                    $timeout(function() {
                        for (var i = 0, len = data.length; i < len; i++) {
                            var member = data[i];
                            if(member.active) {
                                var exists = false;
                                if(duplicateList) {
                                    exists = _.findWhere(duplicateList, {id: member.userID}) !== undefined;
                                }
                                if(exists === false) {
                                    recipientList.push({name: member.name, id: member.userID});
                                }
                            }
                        }
                        compose.loading = false;
                    }, 500);
                }, function() {
                    compose.loading = false;
                });
            }

            compose.remove = function(member) {
                compose.toList = _.without(compose.toList, _.findWhere(compose.toList, {id: member.id}));
            };

            compose.removeCC = function(member) {
                compose.ccList = _.without(compose.ccList, _.findWhere(compose.ccList, {id: member.id}));

                if(compose.ccList.length === 0) {
                    compose.addLMT = false;
                }
            };

            compose.addTeam = function() {
                compose.addLMT = true;

                compose.loading = true;
                $timeout(function() {
                    compose.ccList = [];
                    loadLearningTeam(compose.ccList, compose.toList);
                });
            };

            $scope.$on("menu.send", function() {
                if(_.isUndefined(compose.subject) || compose.subject.length === 0) {
                    $scope.send_message.submitted = true;
                    $scope.send_message.subject.$invalid = true;
                    compose.subjectError = gettextCatalog.getString("Subject required");
                } else {
                    loopmailService.send(compose.toList, compose.ccList, compose.subject, compose.body);
                }
            });

            $scope.$on("menu.cancel", function() {
                $window.history.back();
            });

            $scope.$on("menu.back", function() {
                $window.history.back();
            });

            function isTeacher() {
                var domain = storageService.getDefaultDomain();
                return (domain.user.role !== 'student' && domain.user.role !== 'parent');
            }

        }

        function PropsFilter() {
            return function(items, props) {
                var out = [];

                if (angular.isArray(items)) {
                    items.forEach(function(item) {
                        var itemMatches = false;

                        var keys = Object.keys(props);
                        for (var i = 0; i < keys.length; i++) {
                            var prop = keys[i];
                            var text = props[prop].toLowerCase();
                            if (item[prop].toString().toLowerCase().indexOf(text) !== -1 || item[prop].toString() === "No Results") {
                                itemMatches = true;
                                break;
                            }
                        }

                        if (itemMatches) {
                            out.push(item);
                        }
                    });
                } else {
                    // Let the output be the input untouched
                    out = items;
                }

                return out;
            };
        }

})();
