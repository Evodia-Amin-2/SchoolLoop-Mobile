(function() {
    'use strict';

    angular.module('app.services')
        .factory('NavbarService', [NavbarService])
    ;

    function NavbarService() {
        var title = "Main";
        var backEnabled = false;
        var mailEnabled = true;
        var editMode = false;
        var sendEnabled = false;
        var replyEnabled = false;
        var loopMenuEnabled = false;
        var doneEnabled = false;

        var service = {
            reset: function() {
                backEnabled = false;
                mailEnabled = false;
                editMode = false;
                sendEnabled = false;
                replyEnabled = false;
                loopMenuEnabled = false;
                doneEnabled = false;
            },
            setTitle: function(value) {
                title = value;
            },
            getTitle: function() {
                return title;
            },
            setBackEnabled: function(value) {
                backEnabled = value;
            },
            isBackEnabled: function() {
                return backEnabled;
            },
            setEditMode: function(value) {
                editMode = value;
            },
            isEditMode: function() {
                return editMode;
            },
            setMailEnabled: function(value) {
                mailEnabled = value;
            },
            isMailEnabled: function() {
                return mailEnabled;
            },
            setSendEnabled: function(value) {
                sendEnabled = value;
            },
            isSendEnabled: function() {
                return sendEnabled;
            },
            setDoneEnabled: function(value) {
                doneEnabled = value;
            },
            isDoneEnabled: function() {
                return doneEnabled;
            },
            setReplyEnabled: function(value) {
                replyEnabled = value;
            },
            isReplyEnabled: function() {
                return replyEnabled;
            },
            setLoopMenuEnabled: function(value) {
                loopMenuEnabled = value;
            },
            isLoopMenuEnabled: function() {
                return loopMenuEnabled;
            }
        };
        return service;
    }
})();
