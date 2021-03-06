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
        var backButtonExit = true;

        var service = {
            clear: function() {
                storage.clear();
            },
            clearOnce: function() {
                var reset = JSON.parse(storage.getItem("reset"));
                if (_.isUndefined(reset) === true || _.isNull(reset) === true) {
                    storage.clear();
                    storage.setItem("reset", "1");
                }
            },
            isLoggedIn: function() {
                var domain = service.getDefaultDomain();
                return _.isUndefined(domain) === false && _.isUndefined(domain.user.hashedPassword) === false;
            },
            getPassword: function(domain) {
                var password;
                if (_.isUndefined(domain) === false && _.isNull(domain) === false) {
                    try {
                        domain.encrypted = undefined;
                        password = domain.user.hashedPassword;
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
                if(_.isUndefined(domain) === true) {
                    domain = {};
                    domain.user = {};
                }
                if(user.userName !== domain.user.userName || _.isUndefined(domain.user.userID) === true) {
                    domain.encrypted = undefined;
                    domain.user = user;
                }
                domain.user.hashedPassword = password;

                if (_.isUndefined(domain) === false && _.isNull(domain) === false) {
                    saveDomainMap(domainMap);
                }
            },
            resetPassword: function(username/*, password*/) {
                var domain = service.getDefaultDomain();
                if (_.isUndefined(domain) === false && _.isNull(domain) === false) {
                    if(domain.user.userName === username) {
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
                    domain.user.hashedPassword = undefined;
                    domain.encrypted = undefined;
                    saveDomainMap(domainMap);
                }
            },
            getDomainMap: function() {
                var domainMap = loadDomainMap();
                return domainMap;
            },
            getDomain: function(domainName) {
                var domainMap = loadDomainMap();
                var domain = domainMap[domainName];
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
                        service.clear();
                        domain = {};
                        domainMap = {};
                        service.setSchool(school);
                    }
                }
                domain.school = school;
                domain.user = JSON.parse(JSON.stringify(user)); // make a copy
                delete domain.user.students;

                domain.user.hashedPassword = password;

                domainMap[school.domainName] = domain;
                saveDomainMap(domainMap);
            },
            setSchool: function(school) {
                console.log("setting school: " + JSON.stringify(school));
                storage.setItem("school", JSON.stringify(school));
            },
            getSchool: function() {
                return JSON.parse(storage.getItem("school"));
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
            getParentSchool: function(parentId) {
                var domainMap = loadDomainMap();
                var domainName;
                var school;
                for(domainName in domainMap) {
                    if(domainMap.hasOwnProperty(domainName)) {
                        var domain = domainMap[domainName];
                        var user = domain.user;
                        if(parentId === user.userID) {
                            school = domain.school;
                            break;
                        }
                    }
                }
                return school;
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
            getSelectedStudent: function() {
                var student;
                var students = loadStudents();
                var id = storage.getItem("selectedStudent");
                if (id !== null) {
                    for (var i = 0, len = students.length; i < len; i++) {
                        if (students[i].studentID === id) {
                            student = students[i];
                            break;
                        }
                    }
                }
                return student;
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
                        result = _.find(currentStudents, {studentID: student.studentID});
                        if (_.isUndefined(result) === true) {
                            currentStudents.push(student);
                        }
                    }
                    if (remove === true) {
                        // remove students
                        var valid = [];
                        for (i = 0, len1 = currentStudents.length; i < len1; i++) {
                            student = currentStudents[i];
                            result = _.find(students, {studentID: student.studentID});
                            if (_.isUndefined(result) === false) {
                                valid.push(student);
                            } else if (student.school.domainName !== school.domainName) {
                                valid.push(student);
                            }
                        }
                        currentStudents = valid;
                    }

                    storage.setItem("students", JSON.stringify(currentStudents));

                    var selectedId = storage.getItem("selectedStudent");
                    result = _.find(currentStudents, {studentID: selectedId});
                    if(_.isUndefined(result) === true && currentStudents.length > 0) {
                        service.setSelectedStudentId(currentStudents[0].studentID);
                    }
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
                outgoingMail = _.without(outgoingMail, _.find(outgoingMail, {date: mail.date}));
                setOutgoingMail(outgoingMail);
                return outgoingMail;
            },
            setBackButtonExit: function(state) {
                backButtonExit = state;
            },
            getBackButtonExit: function() {
                return backButtonExit;
            }
        };
        return service;

        function loadSchool() {
            var school = {};
            var data = storage.getItem("school");
            var domainName;
            var map;
            var domain;
            if (data) {
                try {
                    school = JSON.parse(data);
                } catch (err) {
                    domainName = data;
                    map = loadDomainMap();
                    domain = map[domainName];
                    if(domain) {
                        school = domain.school;
                        service.setSchool(school);
                    }
                }
            } else {
                map = loadDomainMap();
                for(domainName in map) {
                    if(map.hasOwnProperty(domainName)) {
                        domain = map[domainName];
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
