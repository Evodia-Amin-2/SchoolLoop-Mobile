/*jshint sub:true*/
(function() {
    'use strict';

    angular.module('app.services')
        .factory('LoginService', ['$http', '$q', 'Base64', 'config', LoginService])
    ;

    function LoginService($http, $q, Base64, config) {
        function doLogin(url, username, password) {
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

            var params = {
                "version": parseVersion(config.version),
                "devToken": device.uuid || "",
                "devOS": device.platform,
                "year": new Date().getFullYear()
            };
            $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode(username + ':' + password);

            var endpoint = "https://" + url + "/mapi/login";
            console.log(endpoint + " params=" + JSON.stringify(params));

            var parameters = {
                params: params
            };

            return $http.get(endpoint, parameters);
        }

        return {"login": doLogin};
    }

    function parseVersion(version) {
        var tokens = version.split(" ");
        return tokens[0];
    }
})();
