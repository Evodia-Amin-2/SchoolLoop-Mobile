/*jshint sub:true*/
(function() {
    'use strict';

    angular.module('app.services')
        .factory('LoginService', ['$http', '$q', 'config', 'StorageService', 'DataService', LoginService])
    ;

    function LoginService($http, $q, config, storageService, dataService) {
        function login(url, username, password) {
            if(config.data) {
                var data = config.data.login;
                if(data) {
                    var dataDeferred = $q.defer();
                    setTimeout(function() {
                        dataDeferred.resolve(data);
                    }, 150);
                    return dataDeferred.promise;
                }
            }
            var school = storageService.getSchool();
            if(_.isUndefined(school) === true) {
                return;
            }

            if(_.isUndefined(url) === true) {
                url = school.domainName;
            }

            var hashed = false;
            if(_.isUndefined(username) === true) {
                var domain = storageService.getDomain(url);
                username = domain.user.userName;
                password = domain.user.hashedPassword;
                hashed = _.isUndefined(password) === false;
            }

            var params = {
                "version": parseVersion(config.version),
                "uuid": device.uuid,
                "devOS": device.platform,
                "year": new Date().getFullYear(),
                "hash": hashed
            };

            dataService.setupAuthHeaders(username, password, params, hashed);
            var endpoint = "https://" + url + "/mapi/login";
            console.log(endpoint + " params=" + JSON.stringify(params));

            var parameters = {
                params: params
            };

            return $http.get(endpoint, parameters);
        }

        function logout() {
            var result;
            // Login each user in order to receive notifications
            var defaultDomain = storageService.getDefaultDomain();
            var domainMap = storageService.getDomainMap();
            var domainName;
            for(domainName in domainMap) {
                if(domainMap.hasOwnProperty(domainName)) {
                    var domain = domainMap[domainName];
                    var user = domain.user;
                    dataService.setupAuthHeaders(user.userName, user.hashedPassword, {}, true);
                    var school = domain.school;
                    var url = school.domainName;
                    var endpoint = "https://" + url + "/mapi/logout";
                    if(defaultDomain.school.domainName === school.domainName) {
                        result = $http.get(endpoint);
                    } else {
                        $http.get(endpoint);
                    }

                }
            }
            return result;
        }

        return {"login": login,
            "logout": logout};
    }

    function parseVersion(version) {
        var tokens = version.split(" ");
        return tokens[0];
    }
})();
