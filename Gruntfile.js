module.exports = function(grunt) {
    this.loadNpmTasks('grunt-contrib-watch');
    this.loadNpmTasks('grunt-contrib-sass');
    this.loadNpmTasks('grunt-contrib-uglify');
    this.loadNpmTasks('grunt-aws');
    this.loadNpmTasks('grunt-ng-annotate');
    this.loadNpmTasks('grunt-contrib-cssmin');

    this.initConfig({
        aws: grunt.file.readJSON("config/aws.json"),

        s3: {
            options: {
                accessKeyId: "<%= aws.accessKeyId %>",
                secretAccessKey: "<%= aws.secretAccessKey %>",
                bucket: "..."
            },
            build: {
                cwd: "build",
                src: "**"
            }
        },
        sass: {
            dist: {
                files: {
                    'public/css/account.css': 'scss/account.scss',
                    'public/css/all.css': 'scss/all.scss',
                    'public/css/form.css': 'scss/form.scss'
                }
            }
        },
        ngAnnotate: {
            options: {
                singleQuotes: true
            },
            app: {
                files: [
                    {
                        'public/js/angular/twerkApp.annotated.js': ['public/js/angular/twerkApp.js', 'public/js/angular/**/*.js', '!public/js/angular/**/*.annotated.js']
                    }
                ]
            }
        },
        cssmin: {
            target: {
                files: [{
                    src: [
                        'public/css/bootstrap.min.css',
                        'public/font-awesome/css/font-awesome.min.css',
                        'public/css/style.css',
                        'public/color/default.css',
                        'public/bower_components/angular-ui-select/dist/select.min.css',
                        'public/bower_components/selectize/dist/css/selectize.default.css',
                        'public/bower_components/select2/select2.css',
                        'public/bower_components/angular-loading-bar/build/loading-bar.css',
                        'public/css/all.css',
                        'public/bower_components/angular-xeditable/css/xeditable.css',
                        'public/bower_components/angular-ui/build/angular-ui.min.css',
                        'public/bower_components/textAngular/src/textAngular.css'
                    ],
                    dest: 'public/css/application.min.css'
                },
                    {
                        src: 'public/css/all.css',
                        dest: 'public/css/all.min.css'
                    }],
                options: {
                    rebase: true,
                    target: 'public/css/'
                }
            }
        },
        uglify: {
            js: {
                files: [{
                    src: [
                        'public/bower_components/ng-file-upload/angular-file-upload-html5-shim.js',
                        'public/bower_components/angular/angular.js',
                        'public/bower_components/angular-loading-bar/build/loading-bar.js',
                        'public/bower_components/angular-socket-io/socket.js',
                        'public/bower_components/angular-once/once.js',
                        'public/bower_components/angular-animate/angular-animate.js',
                        'public/bower_components/angular-strap/dist/angular-strap.js',
                        'public/bower_components/angular-strap/dist/angular-strap.tpl.js',
                        'public/bower_components/ng-file-upload/angular-file-upload.js',
                        'public/js/jquery.min.js',
                        'public/bower_components/ngInfiniteScroll/build/ng-infinite-scroll.js',
                        'public/js/bootstrap.min.js',
                        'public/bower_components/angular-bootstrap/ui-bootstrap.js',
                        'public/bower_components/angular-bootstrap/ui-bootstrap-tpls.js',
                        'public/bower_components/angular-ui-select/dist/select.js',
                        'public/bower_components/angular-flash/dist/angular-flash.js',
                        'public/bower_components/ui-router/release/angular-ui-router.js',
                        'public/bower_components/angular-xeditable/dist/js/xeditable.js',
                        'public/bower_components/angular-ui/build/angular-ui.js',
                        'public/bower_components/textAngular/src/textAngularSetup.js',
                        'public/bower_components/textAngular/src/textAngular-sanitize.js',
                        'public/bower_components/rangy-official/rangy-core.js',
                        'public/bower_components/rangy-official/rangy-selectionsaverestore.js',
                        'public/bower_components/textAngular/src/textAngular.js',
                        'public/bower_components/angular-cookies/angular-cookies.js',
                        'public/bower_components/angular-ui-utils/ui-utils.js',
                        'public/bower_components/angular-smart-table/dist/smart-table.min.js',
                        'public/js/angular/twerkApp.annotated.js'
                    ],
                    dest: 'public/js/application.min.js'
                }],
                options: {
                    preserveComments: false,
                    mangle: false,
                    sourceMap : true,
                    sourceMapName : 'public/js/application.min.js.map'
                }
            }
        },

        watch: {
            sass: {
                files: ['scss/*.scss'],
                tasks: ['sass']
            },
            css: {
                files: [
                    'public/css/bootstrap.min.css',
                    'public/font-awesome/css/font-awesome.min.css',
                    'public/css/animate.css',
                    'public/css/style.css',
                    'public/color/default.css',
                    'bower_components/angular-ui-select/dist/select.min.css',
                    'bower_components/selectize/dist/css/selectize.default.css',
                    'bower_components/select2/select2.css',
                    'bower_components/angular-xeditable/css/xeditable.css',
                    'bower_components/angular-ui/build/angular-ui.min.css',
                    'bower_components/textAngular/src/textAngular.css',
                    'public/css/all.css'
                ],
                tasks: ['cssmin']
            }
        }
    });

    return this.registerTask('default', ['sass', 'ngAnnotate', 'uglify', 'cssmin', 'watch']);
};
