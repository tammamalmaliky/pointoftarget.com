/*
 * grunt-dev-server
 * https://github.com/meenie/grunt-dev-server
 *
 * Copyright (c) 2014 Cody Lundquist
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
    grunt.registerMultiTask('dev_server', 'Start an E2E server.', function e2eServerTask() {
        var http = require('http'),
            url = require('url'),
            path = require('path'),
            mime = require('mime'),
            swig = require('swig'),
            done = this.async(),
            options = this.options({
                port: 8888,
                swigCache: 'memory',
                swigVarControls: ['{{', '}}'],
                base_dir: './',
                keep_alive: false,
                scripts: '**/*.js',
                stylesheets: '**/*.css',
                vendor_scripts: [],
                vendor_stylesheets: [],
                urlAliases: {}
            }),
            makeAbsolute =  function(path) { return '/' + path; },
            vendor_scripts = grunt.file.expand(options.vendor_scripts).map(makeAbsolute),
            vendor_stylesheets = grunt.file.expand(options.vendor_stylesheets).map(makeAbsolute),
            scripts = grunt.file.expand([options.scripts, '!node_modules/**']).map(makeAbsolute),
            stylesheets = grunt.file.expand([options.stylesheets, '!node_modules/**']).map(makeAbsolute),
            isAsset = function(filename) {
                return ! grunt.file.isMatch('**/*.html', filename);
            },
            isTemplate = function(filename) {
                return grunt.file.isMatch('**/*.html', filename);
            };

        swig.setDefaults({
            cache: options.swigCache,
            varControls: options.swigVarControls
        });

        http.createServer(function(request, response) {
            var uri = url.parse(request.url).pathname,
                base_dir = path.join(process.cwd(), options.base_dir),
                filename = path.join(base_dir, uri);

            if (options.urlAliases[uri] !== undefined) {
                filename = path.join(base_dir, options.urlAliases[uri]);
            }

            if (grunt.file.isDir(filename)) {
                filename = path.join(filename, 'index.html');
            }

            if (! grunt.file.exists(filename)) {
                response.writeHead(404);

                return response.end();
            }

            if (isAsset(filename)) {
                var content = grunt.file.read(filename,  {encoding: null});
                response.writeHead(200, {'Content-Type': mime.lookup(filename)});
                response.write(content, 'binary');

                return response.end();
            }

            if (isTemplate(filename)) {
                var template = swig.compileFile(filename),
                    renderedHtml = template({
                        vendor_scripts: vendor_scripts,
                        vendor_stylesheets: vendor_stylesheets,
                        scripts: scripts,
                        stylesheets: stylesheets
                    });

                response.writeHead(200, { 'Content-Type': 'text/html' });
                response.end(renderedHtml);
            }
        }).listen(parseInt(options.port, 10)).on('listening', function() {
            grunt.log.writeln('E2E Server Running at http://localhost:' + options.port);
            if (! options.keep_alive) {
                done();
            }
        });
    });
};
