//'use strict';
//var path = require('path');

// match one level down:
// e.g. 'bar/foo/{,*/}*.js'
// use this if you want to recursively match all subfolders:
// e.g. 'bar/foo/**/*.js'

module.exports = function (grunt) {
    'use strict';

    // Project assets
    // Loads project js files which will be concatenated and minified in one file
    var projectJsfiles = grunt.file.readJSON('jsfiles.json').concatCustomJsFiles;
    var govukJsfiles = grunt.file.readJSON('jsfiles.json').concatGovUkJsFiles;
    var jqueryBundle = grunt.file.readJSON('jsfiles.json').jqueryBundle;
    var ie8Bundle = grunt.file.readJSON('jsfiles.json').ie8Bundle;

    // Load all grunt tasks
    require('load-grunt-tasks')(grunt);
    // Show elapsed time at the end
    require('time-grunt')(grunt);

    // Init
    grunt.initConfig({
        timestamp: '<%= new Date().getTime() %>',
        pkg: grunt.file.readJSON('package.json'),

        src: {
            path: 'wwwroot/src',
            sass: '**/*.{scss,sass}'
        },

        dist: {
            path: 'wwwroot'
        },

        // Clean all generated files
        clean: {
            all: {
                files: [{
                    src: [
                        '<%= dist.path %>/**/*.css',
                        '<%= dist.path %>/**/*.js',
                        '<%= dist.path %>/**/*.{png,jpg,gif,jpeg}',
                        '!<%= dist.path %>/src/**',
                        'csslint_report'
                    ]
                }]
            },
            css: {
                files: [{
                    src: [
                        '<%= dist.path %>/**/*.css',
                    ]
                }]
            },
            images: {
                files: [{
                    src: [
                        '<%= dist.path %>/**/*.{png,jpg,gif,jpeg}'
                    ]
                }]
            }
        },

        sass: {
            options: {
                outputStyle: 'nested',
                includePaths: [
                    'node_modules/govuk_frontend_toolkit/stylesheets',
                    'node_modules/govuk-elements-sass/public/sass'
                ]
            },
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= src.path %>/sass',
                    src: ['*.scss'],
                    dest: '<%= dist.path %>/css/',
                    ext: '.css'
                }]
            }
        },

        // use always with target e.g. `csslint:doc` or `csslint:dev`
        // unfortunately there is no point to run csslint on compressed css so
        // csslint runs once, when you use `grunt` and it lints on documentation's css
        // csslint runs on every save when you use `grunt dev` and it lints the original file you are working on -> `style.css`
        csslint: {
            options: {
                csslintrc: 'csslint.json',
                quiet: true,
                formatters: [{
                    id: 'csslint-xml',
                    dest: 'csslint_report/csslint.xml'
                }],
            },
            dev: {
                expand: true,
                cwd: '<%= dist.path %>/css/',
                src: [
                    '*.css',
                    '!*.min.css',
                    '!fonts.css',
                    '!govuk-template*.css'
                ],
            }
        },

        cssmin: {
            options: {
                level: 2,
            },
            target: {
                expand: true,
                cwd: '<%= dist.path %>/css/',
                src: ['*.css', '!*.min.css'],
                dest: '<%= dist.path %>/css/',
                ext: '.min.css',
                extDot: 'last'
            },
        },

        copy: {
            dist: {
                files: [
                    { expand: true, cwd: 'wwwroot/src/fonts', src: '**', dest: 'wwwroot/fonts/' },
                    { expand: true, cwd: 'node_modules/govuk_frontend_toolkit/images', src: ['**/*.{png,jpg,gif,jpeg,svg,ico}', '!fonts/*', '!sprite/*.*'], dest: 'wwwroot/images' },
                    { expand: true, cwd: 'node_modules/govuk_template_mustache/assets/images', src: ['**/*.{png,jpg,gif,jpeg,svg,ico}', '!fonts/*', '!sprite/*.*'], dest: 'wwwroot/images' },
                    { expand: true, cwd: 'node_modules/govuk_template_mustache/assets/stylesheets', src: '**/*.*', dest: 'wwwroot/css' },
                    { expand: true, cwd: 'wwwroot/src/js/', src: 'selectivizr.min.js', dest: 'wwwroot/js' },
                ]
            }
        },

        // Concatenates & minifies js files
        // Processes the files described in 'jsfiles.json' + bootstrap.js
        uglify: {
            options: {
                report: 'gzip',
                warnings: true,
                ie8: true,
                mangle: {
                    reserved: ['jQuery', 'Modernizr', 'selectivizr']                  
                },
                compress: true
            },
            dist: {
                files: [
                    // Project assets
                    // Concatenates project files listed in jsfiles.json
                    { '<%= dist.path %>/js/dfcdigital.min.js': projectJsfiles },
                    { '<%= dist.path %>/js/govuksel.min.js': govukJsfiles },
                    { '<%= dist.path %>/js/jquerybundle.min.js': jqueryBundle },
                    { '<%= dist.path %>/js/ie8bundle.min.js': ie8Bundle },
                    {
                        expand: true,
                        src: ['*.js', '!*.min.js'],
                        dest: 'wwwroot/js',
                        cwd: 'wwwroot/js',
                        rename: function (dst, src) {
                            // To keep the source js files and make new files as `*.min.js`:
                            return dst + '/' + src.replace('.js', '.min.js');
                            // Or to override to src:
                            //return src;
                        }
                    }
                ]
            }
        },

        // Image Optimization
        imagemin: {
            dist: {
                options: {
                    optimizationLevel: 4,
                    progressive: true
                },
                files: [
                    { expand: true, cwd: 'wwwroot/src/images', src: ['**/*.{png,jpg,gif,jpeg,svg}', '!fonts/*', '!sprite/*.*'], dest: 'wwwroot/images' }
                ]
            }
        },

        watch: {
            options: {
                spawn: false
            },
            styles: {
                files: ['<%= src.path %>/**/*.{scss,sass}'],
                tasks: ['sass', 'csslint:dev', 'cssmin']
            },
            images: {
                files: ['<%= src.path %>/**/*.{png,jpg,gif,jpeg}'],
                tasks: ['clean:images', 'sprite', 'imagemin']
            },
            js: {
                files: ['<%= src.path %>/**/*.js'],
                tasks: ['uglify']
            }
        },

        concurrent: {
            dist: {
                tasks: ['watch:styles', 'watch:js', 'watch:images'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    // Default task
    grunt.registerTask('default', ' ', function () {
        grunt.task.run('clean:all');
        grunt.task.run('copy');
        grunt.task.run('uglify');
        grunt.task.run('sass');
        grunt.task.run('csslint:dev');
        grunt.task.run('cssmin');
        grunt.task.run('newer:imagemin');
        //grunt.task.run('concurrent'); we dont want to block the release pipeline
    });
};