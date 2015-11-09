(function() {
    'use strict';

    angular.module('app.services')
        .factory('SchoolService', ['$http', '$q', 'config', SchoolService])
    ;

    function SchoolService($http, $q, config) {
        var cachedList = [];
        return {
            "list": function() {
                var deferred = $q.defer();
                if(cachedList.length === 0) {
                    var endpoint = config.api + "/mapi/schools";
                    console.log("Loading schools endpoint: " + endpoint);
                    $http.get(endpoint).then(
                        function(response) {
                            if(String(response.data).indexOf("SUCCESS") === 0) {
                                response.data = [];
                            }
                            console.log("Loading schools: " + response.data.length);
                            cachedList = response.data;
                            deferred.resolve(response.data);
                        },
                        function(response) {
                            console.log("Loading schools failed: " + response.data);
                            deferred.reject(response);
                        }
                    );
                } else {
                    deferred.resolve(cachedList);
                }
                return deferred.promise;
            }
        };
    }
})();
