(function() {
    'use strict';

    angular.module('mobileloop')
        .controller('ResetController', ['$scope', '$state', 'DataService', 'StorageService', 'gettextCatalog', ResetController])
        ;

        function ResetController($scope, $state, dataService, storageService, gettextCatalog) {
            var reset = this;

            StatusBar.styleDefault();
            StatusBar.backgroundColorByHexString("#5d8dc5");

            reset.cancel = function() {
                goLogin();
            };

            reset.reset = function() {
                $scope.reset_form.submitted = true;
                if($scope.reset_form.$valid) {
                    if(reset.password === reset.confirm) {
                        dataService.resetPassword(reset.password).then(
                            function(message) {
                                var data = message.data;
                                if(_.isString(data) && data.startsWith("ERROR")) {
                                    reset.password = undefined;
                                    reset.confirm = undefined;
                                    $scope.reset_form.password.placeholder = message.data;
                                    $scope.reset_form.password.$invalid = true;
                                } else {
                                    var school = storageService.getSelectedSchool();
                                    storageService.addDomain(school, data, reset.password);
                                    storageService.addStudents(school, data.students, true);
                                    $state.go('main');
                                }
                            },
                            function() {
                                goLogin();
                            }
                        );
                    } else {
                        reset.confirm = undefined;
                        $scope.reset_form.confirm.$invalid = true;
                        $scope.reset_form.confirm.placeholder = gettextCatalog.getString("Passwords don't match");
                    }
                } else {
                    if(_.isUndefined(reset.password) === true) {
                        $scope.reset_form.password.$invalid = true;
                        $scope.reset_form.password.placeholder = gettextCatalog.getString("Password Required!");
                    }
                    if(_.isUndefined(reset.confirm) === true) {
                        $scope.reset_form.confirm.$invalid = true;
                        $scope.reset_form.confirm.placeholder = gettextCatalog.getString("Password Required!");
                    }
                }
            };

            function goLogin() {
                var domain = storageService.getDefaultDomain();
                var domainName = domain.school.domainName;
                storageService.clearPassword(domainName);
                $state.go('login');
            }

        }
})();
