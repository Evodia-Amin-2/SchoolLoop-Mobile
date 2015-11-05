/*!
 * gulp
 * npm install gulp-jshint gulp-concat  gulp-rename gulp-stylus gulp-plumber gulp-util --save-dev
 */

var destPath = "www";
var srcPath = "build";
var browserPath = "platforms/browser/www";
// Load plugins
var gulp = require('gulp');
var jshint = require('gulp-jshint');
var concat = require('gulp-concat');
var rename = require('gulp-rename');
var stylus = require('gulp-stylus');
var plumber = require('gulp-plumber');
var bowerFiles = require('main-bower-files');
var gutil = require('gulp-util');
var config = require('gulp-ng-config');
var shell = require('gulp-shell');
var del = require('del');
var flags = require('minimist')(process.argv.slice(2));
var replace = require('gulp-replace');
var gettext = require('gulp-angular-gettext');
var addsrc = require('gulp-add-src');
var templateCache = require('gulp-angular-templatecache');

var configFile = "config.json";
if(flags["config"] && flags["config"].length > 0) {
    configFile = "config-" + flags["config"] + ".json";
}

gulp.task('app-assets', function () {
    return gulp.src([srcPath + '/assets/**/*.*'])
        .pipe(gulp.dest(destPath))
        .pipe(gulp.dest(browserPath));
});

gulp.task('app-config', function () {
    del(['tmp/config.js']);

    var appVersion = flags["app-version"];
    if(!appVersion || appVersion.length === 0) {
        appVersion = "2.1.0";
    }
    var appRelease = flags["app-release"];
    if(!appRelease || appRelease.length === 0) {
        var d = String(new Date());
        var tokens = d.split(" ");
        appRelease = "(" + tokens[1] + " " + tokens[2] + " - " + tokens[4] + ")";
    }
    console.log("appVersion=" + appVersion + " appRelease=" + appRelease + " configFile=" + configFile);

    return gulp.src(configFile)
        .pipe(replace('{version}', appVersion))
        .pipe(replace('{release}', appRelease))
        .pipe(config('app.config'))
        .pipe(rename('config.js'))
        .pipe(gulp.dest('tmp'));
});

gulp.task('app-css', function () {
    return gulp.src([srcPath + '/css/**/*.*',
            'bower_components/ng-mobile-menu/dist/ng-mobile-menu.min.css'
        ])
        .pipe(plumber({ errorHandler: gutil.log }))
        .pipe(stylus())
        .pipe(concat('app.css'))
        .pipe(gulp.dest(destPath + '/css'))
        .pipe(gulp.dest(browserPath + '/css'));
});

gulp.task('app-js', ['app-config', 'translations'], function () {
    return gulp.src([srcPath + '/js/app.js', srcPath + '/js/*.js', srcPath + '/js/*/*.js'])
        .pipe(plumber({ errorHandler: gutil.log }))
        .pipe(jshint('.jshintrc'))
        .pipe(jshint.reporter('default'))
        .pipe(addsrc('tmp/*.js'))
        .pipe(concat('app.js'))
        .pipe(gulp.dest(destPath + '/js'))
        .pipe(gulp.dest(browserPath + '/js'));
});

gulp.task('app-html', function () {
    return gulp.src([srcPath + '/html/**/*.html'])
        .pipe(gulp.dest(destPath));
});

gulp.task('app-tmpl', function () {
    return gulp.src([srcPath + '/templates/**/*.html'])
        .pipe(templateCache())
        .pipe(gulp.dest(destPath + '/js'));
});

gulp.task('browser-html', function () {
    return gulp.src([srcPath + '/html/**/*.html', '!' + srcPath + '/html/index.html'])
        .pipe(gulp.dest(browserPath));
});

gulp.task('browser-tmpl', function () {
    return gulp.src([srcPath + '/templates/**/*.html'])
        .pipe(templateCache())
        .pipe(gulp.dest(browserPath + '/js'));
});

gulp.task('vendor-js', function () {
    return gulp.src(bowerFiles())
        .pipe(concat('vendor.js'))
        .pipe(gulp.dest(destPath + '/js'))
        .pipe(gulp.dest(browserPath + '/js'));
});

gulp.task('pot', function () {
    return gulp.src([srcPath + '/html/**/*.html', srcPath + '/js/**/*.js', srcPath + '/templates/**/*.html'])
        .pipe(gettext.extract('mobileloop.pot', {
            // options to pass to angular-gettext-tools...
        }))
        .pipe(gulp.dest(srcPath + '/translations/'));
});

gulp.task('translations', function () {
    return gulp.src(srcPath + '/translations/**/*.po')
        .pipe(gettext.compile({
            // options to pass to angular-gettext-tools...
        }))
        .pipe(gulp.dest('tmp'));
});

gulp.task('android', shell.task([
    'cordova run android'
]));

gulp.task('ios', shell.task([
    'cordova emulate ios --target="iPad-2"'
]));

gulp.task('browser', shell.task([
    'cordova run browser'
]));

gulp.task('watch', function() {
    gulp.watch('config.json', ['app-config', 'app-js']);
    gulp.watch(srcPath + '/css/**/*.*', ['app-config', 'app-css']);
    gulp.watch(srcPath + '/js/**/*.js', ['app-config', 'app-js']);
    gulp.watch(srcPath + '/templates/**/*.html', ['app-config', 'app-tmpl']);
    gulp.watch(srcPath + '/templates/**/*.html', ['app-config', 'browser-tmpl']);
    gulp.watch(srcPath + '/html/**/*.html', ['app-config', 'app-html']);
    gulp.watch(srcPath + '/html/**/*.html', ['app-config', 'browser-html']);
});

// Default task
gulp.task('default', function () {
    gulp.start('app-assets');
    gulp.start('app-css');
    gulp.start('app-js');
    gulp.start('app-html');
    gulp.start('app-tmpl');
    gulp.start('vendor-js');
});