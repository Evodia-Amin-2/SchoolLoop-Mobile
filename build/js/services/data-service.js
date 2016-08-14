/*jshint sub:true,forin:false*/
(function() {
    'use strict';

    angular.module('app.services')
        .constant('DataType', {
            "ASSIGNMENT": "assignments",
            "COURSE": "report_card",
            "LOOPMAIL": "mail_messages",
            "NEWS": "news"
        })
        .factory('DataService', ['$http', '$q', 'Base64', 'StorageService', 'DataType', 'config', DataService])
    ;

    function DataService($http, $q, Base64, storageService, DataType, config) {
        var cache = cache || {};

        var courseTitle = "";
        var folderId = 1;

        var defaultParams = {};
        defaultParams[DataType.LOOPMAIL] = {"folderID": folderId, "start": 0, "max": 20};
        defaultParams[DataType.NEWS] = {"lastRequest": getLastRequestTime(), "alerts": true};

        function cachedResult(element) {
            var dataDeferred = $q.defer();
            setTimeout(function() {
                dataDeferred.resolve(cache[element]);
            });
            return dataDeferred.promise;
        }

        function checkDataLoaded() {
            if(isTeacher()) {
                if(!cache.mail_messages || !cache.news) {
                    return false;
                }
            } else {
                if(!cache.assignments || !cache.report_card || !cache.mail_messages || !cache.news) {
                    return false;
                }
            }
            return true;
        }

        function isTeacher() {
            var domain = storageService.getDefaultDomain();
            return (domain.user.role !== 'student' && domain.user.role !== 'parent');
        }

        var service = {
            clearCache: function() {
                cache = {};
                courseTitle = "";
            },
            cache: function() {
                return cache;
            },
            load: function() {
                var params;
                var requests = [];
                var loopmail = doGet($q, $http, config, DataType.LOOPMAIL, params, defaultParams, storageService, service);
                var news = doGet($q, $http, config, DataType.NEWS, params, defaultParams, storageService, service);
                if(isTeacher() === true) {
                    requests = [loopmail, news];
                } else {
                    var assignments = doGet($q, $http, config, DataType.ASSIGNMENT, params, defaultParams, storageService, service);
                    var courses = doGet($q, $http, config, DataType.COURSE, {trim: true}, defaultParams, storageService, service);
                    requests = [assignments, courses, loopmail, news];
                }

                return $q.all(requests).then(function(result) {
                    var tmp = {};
                    var index = 0;
                    for(var key in DataType) {
                        var type = DataType[key];
                        if(isTeacher() === true && (type === DataType.ASSIGNMENT || type === DataType.COURSE)) {
                            continue;
                        }
                        tmp[type] = result[index++];
                    }

                    return tmp;
                }).then(function(tmpResult) {
                    cache = tmpResult;

                    var newsList = cache[DataType.NEWS];
                    if(newsList) {
                        storageService.setNews(newsList);
                    }
                });
            },
            update: function() {
                var params;
                var loopmail = doGet($q, $http, config, DataType.LOOPMAIL, params, defaultParams, storageService, service);
                var news = doGet($q, $http, config, DataType.NEWS, params, defaultParams, storageService, service);

                return $q.all([loopmail, news]).then(function(result) {
                    var tmp = {};

                    tmp[DataType.LOOPMAIL] = result[0];
                    tmp[DataType.NEWS] = result[1];

                    return tmp;
                }, function(response) {
                    console.log("Error", response);
                    return response;
                }).then(function(tmpResult) {
                    cache[DataType.LOOPMAIL] = tmpResult[DataType.LOOPMAIL];
                    cache[DataType.NEWS] = tmpResult[DataType.NEWS];

                    var newsList = cache[DataType.NEWS];
                    if(newsList) {
                        storageService.setNews(newsList);
                    }
                });
            },
            refresh: function(type) {
                var params;
                return doGet($q, $http, config, type, params, defaultParams, storageService, service).then(function(result) {
                    cache[type] = result;
                    return result;
                });
            },
            list: function(type) {
                if(checkDataLoaded()) {
                    return cache[type];
                }
            },
            listNoReload: function(type) {
                return cache[type];
            },
            getMessage: function(id) {
                if(cache.message && cache.message.ID === id) {
                    return cachedResult("message");
                }
                return doGet($q, $http, config, DataType.LOOPMAIL, {"ID": id}, defaultParams, storageService, service).then(function(response) {
                    cache.message = response;
                    return response;
                });
            },
            getProgressReport: function(periodID) {
                if(cache.progress_report && cache.progress_report.periodID === periodID) {
                    return cachedResult("progress_report");
                }
                return doGet($q, $http, config, "progress_report", {"periodID": periodID, trim: true}, defaultParams, storageService, service).then(
                    function(response) {
                        cache.progress_report = response;
                        return response;
                    }
                );
            },
            clearProgressReport: function() {
                cache.progress_report = undefined;
            },
            getAssignment: function(assignmentID, score) {
                return doGet($q, $http, config, DataType.ASSIGNMENT, {"assignmentID": assignmentID, "score": score}, defaultParams, storageService, service);
            },
            getAssignmentsByCourse: function(periodID) {
                return doGet($q, $http, config, DataType.ASSIGNMENT, {"periodID": periodID}, defaultParams, storageService, service);
            },
            getLoopmail: function(page) {
                page = page || 0;
                return doGet($q, $http, config, DataType.LOOPMAIL, {"folderID": folderId, "start": (page * 20), "max": 20}, defaultParams, storageService, service);
            },
            setCourseTitle: function(title) {
                courseTitle = title;
            },
            getCourseTitle: function() {
                return courseTitle;
            },
            setLoopmailFolder: function(id) {
                folderId = id;
            },
            getFolderId: function() {
                return folderId;
            },
            getStudentLoop: function() {
                if(cache.student_loop) {
                    return cachedResult("student_loop");
                }
                return doGet($q, $http, config, "student_loop", defaultParams, storageService, service).then(function(response) {
                    cache.student_loop = response;
                    return response;
                });
            },
            addStudent: function(params) {
                return doGet($q, $http, config, "add_student", params, defaultParams, storageService, service);
            },
            sendLoopMail: function(toList, ccList, subject, body) {
                var params = {
                    to: getRecipientIds(toList),
                    cc: getRecipientIds(ccList),
                    subject: subject,
                    message: body
                };

                return doPost($q, $http, "mail_messages", params, storageService, service);
            },
            resetPassword: function(password) {
                var params = {
                    'new': password
                };
                return doPost($q, $http, "reset", params, storageService, service);
            },
            sendForgetEmail: function(params) {
                return doGet($q, $http, config, "forgot", params, defaultParams, storageService, service);
            },
            registerDevice: function(params) {
                return doGet($q, $http, config, "register", params, defaultParams, storageService, service);
            },
            accept: function() {
                return doGet($q, $http, config, "accept_agreement", defaultParams, storageService, service);
            },
            getContacts: function(query) {
                return doGet($q, $http, config, "contacts", { "q":query, "max":25 }, defaultParams, storageService, service);
            },
            supportTicket: function(name, subject, details, email, cc) {
                var params = {
                    "devOS": device.platform,
                    'version': parseVersion(config.version),
                    'name': name,
                    'subject': subject,
                    'details': details,
                    'email': email,
                    'cc': cc
                };
                return doPost($q, $http, "help", params, storageService, service);
            },
            setupAuthHeaders: function(username, password, params, hashed) {
                $http.defaults.headers.common['Authorization'] = 'Basic ' + Base64.encode(username + ':' + password);
                if(hashed === true) {
                    $http.defaults.headers.common['SL_HASH'] = 'true';
                    params["hash"] = 'true';
                }
            }
        };
        return service;
    }

    function getRecipientIds(recipientList) {
        var recipientIds = "";
        for (var i = 0, len = recipientList.length; i < len; i++) {
            if (i > 0) {
                recipientIds += " ";
            }
            recipientIds += recipientList[i].id;
        }
        return recipientIds;
    }

    function getLastRequestTime() {
        var requestTime = new Date();
        requestTime = dateFloor(requestTime);
        return requestTime.getTime() - (4 * 7 * 24 * 60 * 60 * 1000);  // 4 weeks earlier
    }

    function dateFloor(d) {
        d.setHours(0, 0, 0, 0);
        return d;
    }

    function doGet($q, $http, config, action, params, defaultParams, storageService, dataService) {

        if(config.data) {
            var data = config.data[action];
            if(data) {
                var dataDeferred = $q.defer();
                setTimeout(function() {
                    dataDeferred.resolve(data);
                }, 150);
                return dataDeferred.promise;
            }
        }

        if(!params) {
            var defaults = defaultParams[action];
            if(_.isUndefined(defaults) === false) {
                params = JSON.parse(JSON.stringify(defaults));
            }
        }
        params = params || {};

        var url = params.url;
        if(_.isUndefined(url) === true) {
            url = storageService.getSelectedSchool().domainName;

        }

        var domain = storageService.getDomain(url);
        if(_.isUndefined(domain) === false && _.isNull(domain) === false) {
            dataService.setupAuthHeaders(domain.user.userName, domain.user.hashedPassword, params, false);
        }

        if(_.isUndefined(params["studentID"]) === true) {
            var studentId = storageService.getStudentId();
            params["studentID"] = studentId;
        }

        var endpoint = "https://" + url + "/mapi/" + action;
        console.log(endpoint + " params=" + JSON.stringify(params));

        var parameters = {
            params: params
        };

        var deferred = $q.defer();
        $http.get(endpoint, parameters).then(
            function(response) {
                if(String(response.data).indexOf("SUCCESS") === 0) {
                    response.data = [];
                }
                deferred.resolve(response.data);
            },
            function(error) {
                deferred.reject(error);
            }
        );
        return deferred.promise;
    }

    function doPost($q, $http, action, params, storageService, dataService) {

        var url = storageService.getSelectedSchool().domainName;
        var domain = storageService.getDomain(url);
        if(_.isUndefined(domain) === false && _.isNull(domain) === false) {
            dataService.setupAuthHeaders(domain.user.userName, domain.user.hashedPassword, params, false);
        }

        var endpoint = "https://" + url + "/mapi/" + action;
        console.log(endpoint + " POST params=" + JSON.stringify(params));

        var deferred = $q.defer();
        $http.post(endpoint, params).then(
            function(response) {
                deferred.resolve(response);
            },
            function(error) {
                deferred.reject(error);
            }
        );

        return deferred.promise;
    }

    function parseVersion(version) {
        var tokens = version.split(" ");
        return tokens[0];
    }
})();
