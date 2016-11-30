(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ComposeController', ['$scope', '$q', '$timeout', 'DataService', 'LoopmailService', 'StorageService', 'Utils', 'gettextCatalog', ComposeController])
    ;

    function ComposeController($scope, $q, $timeout, dataService, loopmailService, storageService, utils, gettextCatalog) {
        var page = this;

        utils.setStatusBar("#009688");

        page.toList = [];
        page.ccList = [];
        page.subject = "";
        page.body = "";

        page.placeholder = {};
        page.placeholder.to = gettextCatalog.getString("To");
        page.placeholder.cc = gettextCatalog.getString("CC");
        page.placeholder.subject = gettextCatalog.getString("Subject");
        page.placeholder.body = gettextCatalog.getString("Message Text");

        page.hasLMT = $scope.mainNavigator.topPage.pushedOptions.hasLMT;
        var teachers = $scope.mainNavigator.topPage.pushedOptions.teachers;
        if(_.isUndefined(teachers) === false) {
            page.toList.push({name: teachers.teacherName, id: teachers.teacherID});
            if(_.isUndefined(teachers.coTeacherID) === false && utils.isNull(teachers.coTeacherName) === false) {
                page.toList.push({name: teachers.coTeacherName, id: teachers.coTeacherID});
            }
        }

        page.error = {};

        page.submitted = false;
        page.loading = true;

        clearErrors();

        page.send = function () {
            if(isFormValid()) {
                loopmailService.send(page.toList, page.ccList, page.subject, page.body).then(
                    function() {
                        $scope.mainNavigator.popPage();
                    },
                    function() {
                        $scope.mainNavigator.popPage();
                    }
                );
            } else {
                page.submitted = true;
                if(page.toList.length === 0) {
                    page.error.to = gettextCatalog.getString("Must include a recipient");
                }
                if(page.subject.length === 0) {
                    page.error.subject = gettextCatalog.getString("Subject required");
                }
            }
        };

        page.removeCC = function(member) {
            page.ccList = _.without(page.ccList, _.findWhere(page.ccList, {id: member.id}));
        };

        page.addLMT = function() {
            page.loading = true;
            $timeout(function() {
                page.ccList = [];
                loadLearningTeam(page.ccList, page.toList);
            });

        };

        page.cancel = function() {
            $scope.mainNavigator.popPage();
        };

        page.searchContacts = function(search) {
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

        page.hasFieldError = function(field) {
            return (page.submitted === true && field.length === 0);
        };

        function clearErrors() {
            page.error.to = "";
            page.error.subject = "";
        }

        function isFormValid() {
            clearErrors();
            return page.toList.length > 0 && page.subject.length > 0;
        }

        function loadLearningTeam(recipientList, duplicateList) {
            dataService.getStudentLoop().then(function(data) {
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
                page.loading = false;
            }, function() {
                page.loading = false;
            });
        }

    }
})();
