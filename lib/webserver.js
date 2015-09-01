var express = require('express');
var fs = require('fs');
var path = require('path');
var util = require('./util');
var Handlebars = handlebars = require('handlebars');

var hfPath = '/code/hf/';
var currPath = '';
var toolPath = path.parse(module.filename).dir;

var compile = require(toolPath + '/compile.js');


module.exports.start = function(opts) {
    var app = express();
    opts.isDebug = opts.d || false;
    opts.hfPath = opts.hfPath || false;
    app.get('/*', function(req, res) {
        if (req.path == '' || req.path == '/') {
            res.end(fs.readFileSync('./index.html'), 'utf-8');
            return;
        }
        if (req.path.indexOf('favicon.ico') > -1) {
            res.end('hello');
            return;
        }
        var channel = req.params[0] || 'default';
        var queryParams = req.query;
        var fileName = {
            header: {
                main: 'header_main',
                styles: 'header_styles',
            },
            sidebar: {
                main: 'ucsidebar',
                styles: 'ucsidebar_styles'
            }
        }
        if (queryParams.header && queryParams.header.indexOf(' ') > -1) {
            fileName.header.main = queryParams.header.split(' ')[0];
            fileName.header.styles = queryParams.header.split(' ')[1];
        }
        if (queryParams.sidebar && queryParams.sidebar.indexOf(' ') > -1) {
            fileName.sidebar.main = queryParams.sidebar.split(' ')[0];
            fileName.sidebar.styles = queryParams.sidebar.split(' ')[1];
        }

        var headerMain = compile({
            channel: channel,
            hfPath: hfPath,
            toolPath: toolPath,
            fileName: fileName.header.main,
            isDebug: opts.isDebug,
            isServer: true
        });
        var headerStyle = compile({
            channel: channel,
            hfPath: hfPath,
            toolPath: toolPath,
            fileName: fileName.header.styles,
            isDebug: opts.isDebug,
            isServer:true
        });
        var sidebarMain = '';
        var sidebarStyle = '';
        if (fs.existsSync('src/' + channel + '/' + fileName.sidebar.main)) {
            var sidebarMain = compile({
                channel: channel,
                hfPath: hfPath,
                toolPath: toolPath,
                fileName: fileName.sidebar.main,
                isDebug: opts.isDebug,
                isServer: true
            });
        }
        if (fs.existsSync('src/' + channel + '/' + fileName.sidebar.styles)) {
            var sidebarStyle = compile({
                channel: channel,
                hfPath: hfPath,
                toolPath: toolPath,
                fileName: fileName.sidebar.styles,
                isDebug: opts.isDebug,
                isServer: true
            });
        }
        Handlebars.registerHelper('header', function() {
            return headerStyle + headerMain;
        });

        Handlebars.registerHelper('sidebar', function() {
            return sidebarStyle + sidebarMain;
        });

        Handlebars.registerHelper('type', function() {
            return channel
        });

        var indexFile = fs.readFileSync(path.join(toolPath, '../template.html'), 'utf-8');
        var template = handlebars.compile(indexFile);
        res.end(template());
    });
    app.on("start", function(e) {
            util.logger.log("fekit server 运行成功, 端口为 " + opts.p + ".")
            util.logger.log("按 Ctrl + C 结束进程.")
        })
       
    app.listen(opts.p);
}
