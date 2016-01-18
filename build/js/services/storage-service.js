(function() {
    'use strict';

    angular.module('app.services')
        .factory('StorageService', ['$window', StorageService])
    ;

    function StorageService($window) {
        var storage = $window.localStorage;
        var visitedNews = null;
        var languageCode = 'en';
        var currentMap;

        var service = {
            clear: function() {
                storage.clear();
            },
            isLoggedIn: function() {
                var domain = service.getDefaultDomain();
                return _.isUndefined(service.getPassword(domain)) === false;
            },
            getPassword: function(domain) {
                var password;
                if (_.isUndefined(domain) === false && _.isNull(domain) === false && _.isUndefined(domain.encrypted) === false) {
                    try {
                        var data = domain.encrypted;
                        data = sjcl.json.encode(data);
                        password = sjcl.decrypt(domain.user.userID, data);
                    } catch (err) {
                        console.log("Password error: " + err);
                        password = undefined;
                    }
                }
                return password;
            },
            setPassword: function(domainName, user, password) {
                var domainMap = loadDomainMap();
                var domain = domainMap[domainName];
                if(user.userName !== domain.user.userName || _.isUndefined(domain.user.userID) === true) {
                    domain.encrypted = undefined;
                    domain.user = user;
                }
                if (_.isUndefined(domain) === false && _.isNull(domain) === false) {
                    var data = sjcl.encrypt(domain.user.userID, password);
                    domain.encrypted = sjcl.json.decode(data);
                    saveDomainMap(domainMap);
                }
            },
            resetPassword: function(username, password) {
                var domain = service.getDefaultDomain();
                if (_.isUndefined(domain) === false && _.isNull(domain) === false) {
                    if(domain.user.userName === username) {
                        var data = sjcl.encrypt(domain.user.userID, password);
                        domain.encrypted = sjcl.json.decode(data);
                        saveDomainMap(currentMap);
                    } else {
                        // different user - clear user and password
                        domain.encrypted = undefined;
                        domain.user = {};
                        saveDomainMap(currentMap);
                    }
                }

            },
            clearPassword: function(domainName) {
                var domainMap = loadDomainMap();
                var domain = domainMap[domainName];
                if (_.isUndefined(domain) === false && _.isNull(domain) === false) {
                    domain.encrypted = undefined;
                    saveDomainMap(domainMap);
                }
            },
            getDomain: function(domainName) {
                var domainMap = loadDomainMap();
                var domain = domainMap[domainName];
                if (_.isUndefined(domain) === false && _.isNull(domain) === false) {
                    domain.password = service.getPassword(domain);
                }
                return domain;
            },
            getDefaultDomain: function() {
                var school = loadSchool();
                var domainName = school.domainName;
                var domain = service.getDomain(domainName);
                return domain;
            },
            addDomain: function(school, user, password) {
                var domainMap = loadDomainMap();
                var domain = domainMap[school.domainName];
                if(_.isUndefined(domain) === true) {
                    domain = {};
                } else {
                    if(domain.user.userID !== user.userID) {
                        storage.clear();
                        domain = {};
                        domainMap = {};
                        service.setSchool(school);
                    }
                }
                domain.school = school;
                domain.user = JSON.parse(JSON.stringify(user)); // make a copy
                delete domain.user.students;
                domainMap[school.domainName] = domain;
                saveDomainMap(domainMap);
                if(password !== null) {
                    service.setPassword(school.domainName, user, password);
                }
            },
            setSchool: function(school) {
                console.log("setting school: " + JSON.stringify(school));
                storage.setItem("school", JSON.stringify(school));
            },
            getSelectedSchool: function() {
                var students = loadStudents();
                if (students.length > 0) {
                    var index = service.getSelectedStudentIndex();
                    return students[index].school;
                } else {
                    var domain = service.getDefaultDomain();
                    if (_.isUndefined(domain) === false && _.isNull(domain) === false) {
                        return domain.school;
                    } else {
                        var school = loadSchool();
                        return school;
                    }
                }
            },
            getStudentId: function() {
                var students = loadStudents();
                if (students.length > 0) {
                    var index = service.getSelectedStudentIndex();
                    return students[index].studentID;
                } else {
                    return storage.getItem("selectedStudent");
                }
            },
            getSelectedStudentIndex: function() {
                var index = 0;
                var students = loadStudents();
                var id = storage.getItem("selectedStudent");
                if (id !== null) {
                    for (var i = 0, len = students.length; i < len; i++) {
                        if (students[i].studentID === id) {
                            index = i;
                            break;
                        }
                    }
                }
                return index;
            },
            setSelectedStudentId: function(id) {
                storage.setItem("selectedStudent", id);
            },
            isSelectedStudent: function(id) {
                var selectedId = storage.getItem("selectedStudent");
                if (selectedId !== null) {
                    return selectedId === id;
                } else {
                    service.setSelectedStudentId(id);
                    return true;
                }
            },
            getStudents: function() {
                var students = loadStudents();
                return students;
            },
            addStudents: function(school, students, remove) {
                var student;
                var result;
                if (_.isUndefined(students) === false && _.isNull(students) === false) {
                    var currentStudents = loadStudents();
                    for (var i = 0, len1 = students.length; i < len1; i++) {
                        student = students[i];
                        result = _.findWhere(currentStudents, {studentID: student.studentID});
                        if (_.isUndefined(result) === true) {
                            currentStudents.push(student);
                        }
                    }
                    if (remove === true) {
                        // remove students
                        var valid = [];
                        for (i = 0, len1 = currentStudents.length; i < len1; i++) {
                            student = currentStudents[i];
                            result = _.findWhere(students, {studentID: student.studentID});
                            if (_.isUndefined(result) === false) {
                                valid.push(student);
                            } else if (student.school.domainName !== school.domainName) {
                                valid.push(student);
                            }
                        }
                        currentStudents = valid;
                    }

                    storage.setItem("students", JSON.stringify(currentStudents));
                }
            },
            setVisited: function(newsItem) {
                var id = "" + newsItem.iD;
                newsItem.isNew = false;
                if(_.isUndefined(visitedNews) || _.isNull(visitedNews)) {
                    loadVisitedNews();
                }
                visitedNews[id] = 'true';
                storage.setItem("visitedNews", JSON.stringify(visitedNews));
            },
            setNews: function(news) {
                if(_.isUndefined(visitedNews) || _.isNull(visitedNews)) {
                    loadVisitedNews();
                }

                var newsCount = 0;
                var minId = null;
                for(var i = 0, len = news.length; i < len; i++) {
                    var newsItem = news[i];
                    newsItem.isNew = (newsItem.isNew === "true" || newsItem.isNew === true);
                    if(isVisited(newsItem) === true) {
                        newsItem.isNew = false;
                    }
                    if(newsItem.isNew === true) {
                        newsCount++;
                    }

                    var newsId = Number(newsItem.iD);
                    if(minId === null || newsId < minId) {
                        minId = newsId;
                    }
                }
                var newMap = {};
                for(var property in visitedNews) {
                    if(visitedNews.hasOwnProperty(property)) {
                        var id = Number(property);
                        var value = visitedNews[property];
                        if(id >= minId && _.isUndefined(value) === false) {
                            newMap[property] = 'true';
                        }
                    }
                }
                visitedNews = newMap;
                storage.setItem("visitedNews", JSON.stringify(visitedNews));
                return newsCount;
            },
            setLanguageCode: function(code) {
                languageCode = code;
            },
            getLanguageCode: function() {
                return languageCode;
            },
            getOutgoingMail: function() {
                return loadOutgoingMail();
            },
            addOutgoingMail: function(mailParams) {
                var outgoingMail = loadOutgoingMail();
                outgoingMail.unshift(mailParams);
                setOutgoingMail(outgoingMail);
            },
            removeOutgoingMail: function(mail) {
                var outgoingMail = loadOutgoingMail();
                outgoingMail = _.without(outgoingMail, _.findWhere(outgoingMail, {date: mail.date}));
                setOutgoingMail(outgoingMail);
                return outgoingMail;
            }
        };
        return service;

        function loadSchool() {
            var school = {};
            var data = storage.getItem("school");
            if (data) {
                try {
                    school = JSON.parse(data);
                } catch (err) {
                    var domainName = data;
                    var map = loadDomainMap();
                    var domain = map[domainName];
                    if(domain) {
                        school = domain.school;
                        service.setSchool(school);
                    }
                }
            } else {
                var map = loadDomainMap();
                for(var domainName in map) {
                    if(map.hasOwnProperty(domainName)) {
                        var domain = map[domainName];
                        school = domain.school;
                        service.setSchool(school);
                        break;
                    }
                }
            }
            return school;
        }

        function loadStudents() {
            var students = [];
            var data = storage.getItem("students");
            if (data) {
                try {
                    students = JSON.parse(data);
                } catch (err) {
                    storage.removeItem("students");
                }
            }
            return students;
        }

        function loadDomainMap() {
            var map = {};
            var data = storage.getItem("domainMap");
            if (data) {
                try {
                    map = JSON.parse(data);
                } catch (err) {
                    storage.removeItem("domainMap");
                }
            }
            currentMap = map;
            return map;
        }

        function saveDomainMap(map) {
            delete map.password;
            storage.setItem("domainMap", JSON.stringify(map));
        }

        function isVisited(newsItem) {
            var id = "" + newsItem.iD;
            return visitedNews[id] === 'true';
        }

        function loadVisitedNews() {
            var data = storage.getItem("visitedNews");
            try {
                visitedNews = JSON.parse(data) || {};
            } catch(err) {
                console.log("error loading: " + err);
                visitedNews = {};
            }
            return visitedNews;
        }

        function setOutgoingMail(outgoingMail) {
            storage.setItem("outgoingMail", JSON.stringify(outgoingMail));
        }

        function loadOutgoingMail() {
            var outgoingMail = [];
            var data = storage.getItem("outgoingMail");
            try {
                outgoingMail = JSON.parse(data) || [];
            } catch (err) {
                console.log("error loading: " + err);
                outgoingMail = [];
            }
            return outgoingMail;
        }

    }

})();
