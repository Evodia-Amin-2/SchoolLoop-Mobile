var gulp = require('gulp');

var jshint = require('gulp-jshint');
var cheerio = require('gulp-cheerio');
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
var runSequence = require('run-sequence');
var fs = require('fs');
var peditor = require('gulp-plist');
var chalk = require('chalk');

var destPath = "app/www";
var srcPath = "build";
var platformsPath = "app/platforms";
var browserPath = "app/platforms/browser/www";

var appId = flags["id"] || "app";
var version = flags["version"] || '3.0.0';
if(appId && appId.length > 0) {
    configFile = "build/versions/" + appId + "/config.json";
}

var profile = flags["profile"] || "app";

var buildData = {};
buildData[appId] = {};

var build = flags["build"];
if(build && build > 0) {
    buildData.index = build;
} else {
    try {
        var dataFile = JSON.parse(fs.readFileSync('./build-data.json'));
        var appData = dataFile[appId];
        if(appData === undefined) {
            gutil.log(chalk.red("build-data.json does not have any info for app: "), chalk.magenta(appId));
            return;
        }
        buildData = dataFile;
    } catch(e) {
        buildData.index = 1;
    }
}

var name = flags["name"];
if(name && name.length > 0) {
    buildData[appId].displayName = name;
}

gulp.task('init', function() {
    runSequence('init-config', 'init-android', 'init-ios', 'init-merges', 'images');
});

// Default task
gulp.task('default', function () {
    gulp.start('app-assets');
    gulp.start('app-css');
    gulp.start('app-js');
    gulp.start('app-html');
    gulp.start('app-tmpl');
    gulp.start('lib-js');
    gulp.start('vendor-js');
});

gulp.task('watch', function() {
    gulp.watch('config.json', ['app-config', 'app-js']);
    gulp.watch(srcPath + '/css/**/*.*', ['app-config', 'app-css']);
    gulp.watch(srcPath + '/assets/**/*.*', ['app-config', 'app-assets']);
    gulp.watch(srcPath + '/js/**/*.js', ['app-config', 'app-js']);
    gulp.watch(srcPath + '/templates/**/*.html', ['app-config', 'app-tmpl']);
    gulp.watch(srcPath + '/templates/**/*.html', ['app-config', 'browser-tmpl']);
    gulp.watch(srcPath + '/html/**/*.html', ['app-config', 'app-html']);
    gulp.watch(srcPath + '/html/**/*.html', ['app-config', 'browser-html']);
});

gulp.task('init-config', function () {
    return gulp.src('./app/config.xml')
        .pipe(plumber({ errorHandler: gutil.log }))
        .pipe(cheerio({
            run: function ($) {
                var author = $('author').text();
                if(author === "School Loop Team") {
                    return;
                }
                $('author').text("School Loop Team");
                $('author').attr("email", "rob@schoolloop.com");
                $('author').attr("href", "http://www.schoolloop.com");
                $('description').text("Mobile App for School Loop.");

                $("platform[name=android]").append('    <preference name="KeepRunning" value="false" />\n    ');
                $("platform[name=ios]").append('    <preference name="Orientation" value="all" />\n    ');

                $("widget").append('    <preference name="DisallowOverscroll" value="true" />\n' +
                    '    <preference name="Orientation" value="default" />\n' +
                    '    <preference name="loglevel" value="DEBUG" />\n' +
                    '    <preference name="AndroidLaunchMode" value="singleTop" />\n' +
                    '    <preference name="ErrorUrl" value="" />\n' +
                    '    <preference name="Fullscreen" value="false" />\n' +
                    '    <preference name="KeepRunning" value="true" />\n' +
                    '    <preference name="SplashScreen" value="screen" />\n' +
                    '    <preference name="SplashScreenDelay" value="2000" />\n' +
                    '    <preference name="AllowInlineMediaPlayback" value="false" />\n' +
                    '    <preference name="AutoHideSplashScreen" value="true" />\n' +
                    '    <preference name="BackupWebStorage" value="none"/>\n' +
                    '    <preference name="EnableViewportScale" value="false" />\n' +
                    '    <preference name="FadeSplashScreen" value="true" />\n' +
                    '    <preference name="FadeSplashScreenDuration" value="250" />\n' +
                    '    <preference name="KeyboardDisplayRequiresUserAction" value="true" />\n' +
                    '    <preference name="MediaPlaybackRequiresUserAction" value="false" />\n' +
                    '    <preference name="ShowSplashScreenSpinner" value="false" />\n' +
                    '    <preference name="SuppressesIncrementalRendering" value="false" />\n' +
                    '    <preference name="TopActivityIndicator" value="gray" />\n' +
                    '    <preference name="GapBetweenPages" value="0" />\n' +
                    '    <preference name="PageLength" value="0" />\n' +
                    '    <preference name="PaginationBreakingMode" value="page" />\n' +
                    '    <preference name="PaginationMode" value="unpaginated" />\n' +
                    '    <preference name="BackupWebStorage" value="none" />\n');

                $("widget").append('    <chcp><config-file url="https://s3-us-west-2.amazonaws.com/schoolloop-hotpush/' + appId + '/chcp.json"/><auto-install enabled="false" /></chcp>\n');
            },
            parserOptions: {
                xmlMode: true
            }
        }))
        .pipe(gulp.dest("./app"));
});

gulp.task('init-ios', function () {
    gutil.log(chalk.cyan("app=")+ chalk.yellow(appId), chalk.cyan("build=") + chalk.yellow(buildData.index), chalk.cyan("name=")+ chalk.yellow(buildData[appId].displayName));

    return gulp.src('./app/platforms/ios/MobileLoop/MobileLoop-info.plist')
        .pipe(plumber({ errorHandler: gutil.log }))
        .pipe(peditor({
            "CFBundleDisplayName": buildData[appId].displayName,
            "CFBundleVersion": buildData.index
        }))
        .pipe(gulp.dest('./app/platforms/ios/MobileLoop/'));
});

gulp.task('init-android', function () {
    return gulp.src('./app/platforms/android/AndroidManifest.xml')
        .pipe(plumber({ errorHandler: gutil.log }))
        .pipe(cheerio({
            run: function ($) {
                var application = $("application");
                application.attr('android:icon', '@mipmap/ic_launcher');
                application.attr('android:label', buildData[appId].displayName);
                var activity = application.children().get(0);
                $(activity).attr('android:label', buildData[appId].displayName);
                var intent = $(activity).children("intent-filter").get(0);
                $(intent).attr('android:label', buildData[appId].displayName);
            },
            parserOptions: {
                xmlMode: true
            }
        }))
        .pipe(gulp.dest("./app/platforms/android/"));
});

gulp.task('init-merges', function () {
    return gulp.src(['./build/merges/**'])
        .pipe(gulp.dest('./app/merges/'))
});

gulp.task('app-assets', function () {
    return gulp.src([srcPath + '/assets/**/*.*',
            'bower_components/onsenui/**/*/css/*.min.css',
            'bower_components/onsenui/**/*/fonts/*',
            'bower_components/onsenui/**/onsen-css-components.css',
            'bower_components/onsenui/**/onsenui.css'
        ])
        .pipe(gulp.dest(destPath))
        .pipe(gulp.dest(browserPath));
});

gulp.task('app-config', ['set-build'], function () {
    del(['tmp/config.js']);

    var appVersion = flags["version"];
    if(!appVersion || appVersion.length === 0) {
        appVersion = "3.0.0";
    }
    var buildNumber = flags["build"];
    if(!buildNumber) {
        buildNumber = buildData.index;
        buildData.index++;
        fs.writeFileSync('./build-data.json', JSON.stringify(buildData, null, '  '));

    }
    gutil.log(chalk.cyan("version=")+ chalk.yellow(appVersion), chalk.cyan("build=") + chalk.yellow(buildNumber), chalk.cyan("config=")+ chalk.yellow(configFile));

    return gulp.src(configFile)
        .pipe(plumber({ errorHandler: gutil.log }))
        .pipe(replace('{version}', appVersion))
        .pipe(replace('{build}', buildNumber))
        .pipe(config('app.config'))
        .pipe(rename('config.js'))
        .pipe(gulp.dest('tmp'));
});

gulp.task('set-build', function () {
    return gulp.src('./app/config.xml')
        .pipe(plumber({ errorHandler: gutil.log }))
        .pipe(cheerio({
            run: function ($) {
                $('widget').attr('version', version);
                $('widget').attr('android-versionCode', buildData.index);
                $('widget').attr('ios-CFBundleVersion', buildData.index);
            },
            parserOptions: {
                xmlMode: true
            }
        }))
        .pipe(gulp.dest("./app"));
});

gulp.task('app-css', function () {
    return gulp.src([
        srcPath + '/css/**/*.*'
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

gulp.task('lib-js', function () {
    return gulp.src([
        'bower_components/angular/angular.min.js',
        'bower_components/onsenui/js/onsenui.js',
        'bower_components/onsenui/js/angular-onsenui.js'
    ])
        .pipe(gulp.dest(destPath + '/lib'))
        .pipe(gulp.dest(browserPath + '/lib'));
});


gulp.task('vendor-js', function () {
    var files = bowerFiles();
    var allowedFiles = [];
    var i;
    for(i = 0; i < files.length; i++) {
        var file = files[i];
        if(file.includes("angular.js") === true || file.includes("onsenui.js") === true ) {
            continue;
        }
        allowedFiles.push(file);
    }
    return gulp.src(allowedFiles)
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

gulp.task('build', ['default'], shell.task([
    'cordova build'
], {'cwd': './app'}));

gulp.task('android', shell.task([
    'cordova run android'
]));

gulp.task('ios', shell.task([
    'cordova emulate ios --target="iPad-2"'
]));

gulp.task('browser', shell.task([
    'cordova run browser'
]));

gulp.task('images-android', function () {
    return gulp.src([srcPath + '/images/' + profile + "/android/**"])
        .pipe(gulp.dest(platformsPath + '/android/res/'));
});

gulp.task('images-ios', function () {
    return gulp.src([srcPath + '/images/' + profile + "/ios/**"])
        .pipe(gulp.dest(platformsPath + '/ios/MobileLoop/Images.xcassets/'));
});

gulp.task('images', function () {
    gulp.start('images-android');
    gulp.start('images-ios');
});
