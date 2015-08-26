require('date-utils');
var fs = require('fs')
var syspath = require('path')
var url = require('url')
var querystring = require('querystring')
var child_process = require('child_process')
var baselib = syspath.join(module.parent.filename, '../')
var utils = require(syspath.join(baselib, 'util'))
    //var minCode = require( syspath.join( baselib , 'commands/min' ) ).minCode
var uglifyjs = require('uglify-js');
var uglifycss = require('uglifycss');

var http = require("http")
var rules = require('./rules')

var VER = new Date().toFormat('YYYYMMDDHH24MISS')
var isDebug = false;
var vermap = versionMapping = false;

exports.usage = "处理header&footer项目编译使用";

exports.set_options = function(optimist) {
    optimist.alias('s', 'server')
    optimist.describe('s', '启动hf测试web服务, 如 fekit hf -s')
    optimist.alias('d', 'debug')
    return optimist.describe('d', '启用调试模式，不会压缩代码，该参数优先级高于-m')
}

exports.run = function(options) {
    if (options.debug) {
        isDebug = true;
    }
    if (options.server) return run_server(options);
    else {
        loadVersionMapping();

        var reg = /src\/.*?\/.*.html$/;
        var styleReg = /src\/common\/.*?\/.*.css$/;

        utils.path.each_directory(process.cwd(), function(path) {

            var partial_path = path.replace(process.cwd(), '');
            var path2 = path.replace(/\\/g, '/')

            var rulesCheckResult = true;

            // css规范检查
            if (styleReg.test(path2) && path2.lastIndexOf('ucsidebar.css') < 0) {
                rulesCheckResult = rules.checkRules(path2);
            }

            if (!rulesCheckResult) {
                utils.logger.error('样式规则检查失败，打包失败，请修改后重新打包');
                // process.exit();
            }


            if (reg.test(path2)) {
                build_file(path, partial_path);
            }
        }, true);

        utils.logger.log('done.')
    }

}

 

function run_server(options) {

    var port = options.p || options.port || "80"

    http.createServer(function(req, res) {
            if (!/\./.test(req.url)) {
                var type = url.parse(req.url).pathname.replace(/^\//, "") || "user"
                var params = querystring.parse(url.parse(req.url).query)
                res.end(loadTemplate(type, params))
            } else {
                res.end("")
            }
        })
        .on("listening", function(e) {
            utils.logger.log("fekit server 运行成功, 端口为 " + port + ".")
            utils.logger.log("按 Ctrl + C 结束进程.")
        })
        .on('error', function(err) {
            utils.logger.log("[error] " + port + " 端口被占用")
        })
        .listen(port)
}

function build_file(path, partial_path) {
    var partial_path_prd = partial_path.replace(/(\/|\\)src(\/|\\)/, '$1prd$2');
    var src = compileHTML(path)
    var prdfile = path.replace(partial_path, partial_path_prd);
    utils.file.mkdirp(utils.path.dirname(prdfile))
    utils.file.io.write(prdfile, src)
    utils.logger.log(path + " done.")
}

function compileHTML(path) {

    var result = [];

    var basePath = utils.path.dirname(path);

    var htmlSrc = utils.file.io.read(path)
    if (!isDebug)
        htmlSrc = grep(htmlSrc, 'space')

    htmlSrc = grep(htmlSrc, 'vermap')

    htmlSrc = grep(htmlSrc, 'ver')

    htmlSrc = grep(htmlSrc, 'html', function(path) {
        var f = combine_path(basePath, path);
        return compileHTML(f)
    })

    htmlSrc = grep(htmlSrc, 'js', function(path) {
        var f = combine_path(basePath, path);
        if (isDebug)
            return utils.file.io.read(f);
        else
            return uglifyjs.minify(utils.file.io.read(f), {
                fromString: true
            }).code.replace(/;?$|;?\s*$/, ";");
    })

    htmlSrc = grep(htmlSrc, 'css', function(path) {
        var f = combine_path(basePath, path);
        if (isDebug)
            return utils.file.io.read(f);
        else
            return uglifycss.processString(utils.file.io.read(f));
    })
    return htmlSrc;

}


function grep(src, type, cb) {

    switch (type) {
        case "vermap":
            if(!versionMapping)
                return src;
            else
                return replaceVerMap(src);
        case "space":
            return src.replace(/\s{2,}/g, " ")
        case "ver":
            return src.replace(/\{\{ver\}\}/g, VER)
        case "js":
            return src.replace(/\{\{js (.*?)\}\}/g, function($0, $1) {
                return ";" + cb($1);
            });
        case "css":
            var _src = src.replace(/\{\{css (.*?)\}\}/g, function($0, $1) {
                return cb($1);
            });
            return fix_Matrix(_src);
        case "html":
            return src.replace(/\{\{html (.*?)\}\}/g, function($0, $1) {
                return cb($1);
            });

    }

}


function combine_path(basePath, filePath) {
    if (utils.path.exists(filePath)) {
        return filePath;
    } else {
        var full = utils.path.join(basePath, filePath);
        if (utils.path.exists(full)) {
            return full
        }
    }
    throw "[ERROR]路径不存在。 " + basePath + " " + filePath;
}


function fix_Matrix(src) {

    var reg = /DXImageTransform.Microsoft.Matrix.*?\)/ig
    return src.replace(reg, function($0) {
        return $0.replace(/,/g, ', ');
    })

}


function loadTemplate(type, params) {
    var rheader = /\{\{header\}\}/g,
        rfooter = /\{\{footer\}\}/g,
        rsidebar = /\{\{sidebar\}\}/g,
        ritem = /\{\{item\}\}/g,
        rtype = /\{\{type\}\}/g

    var src = utils.path.exists("template.html") ? utils.file.io.read("template.html") : utils.file.io.read(__dirname + "/template.html")
    var headerSrc = '',
        footerSrc = '',
        sidebarSrc = ''

    var headerPathArr = [
        'header_main',
        'header_styles'
    ]

    var footerPathArr = [
        'footer_public'
    ]

    var sidebarPathArr = [
        'ucsidebar',
        'ucsidebar_styles'
    ]

    if (params.footer) footerPathArr = params.footer.split(" ")
    if (params.header) headerPathArr = params.header.split(" ")
    if (params.sidebar) sidebarPathArr = params.sidebar.split(" ")

    if (rheader.test(src))
        headerPathArr.forEach(function(filename) {
            var path = process.cwd() + '/src/' + type + '/' + filename + ".html"
            if (utils.path.exists(path)) {
                headerSrc += compileHTML(path)
                utils.logger.log("Request " + path + " Success")
            }
        })

    if (rfooter.test(src))
        footerPathArr.forEach(function(filename) {
            var path = process.cwd() + '/footer/' + filename + ".html"
            if (utils.path.exists(path)) {
                footerSrc += compileHTML(path)
                utils.logger.log("Request " + path + " Success")
            }
        })

    if (rsidebar.test(src))
        sidebarPathArr.forEach(function(filename) {
            var path = process.cwd() + '/src/' + type + '/' + filename + ".html"
            if (utils.path.exists(path)) {
                sidebarSrc += compileHTML(path)
                utils.logger.log("Request " + path + " Success")
            }
        })

    if (type === "user") type = "info"

    src = handleSSI(src)

    return src.replace(rtype, type)
        .replace(rheader, headerSrc)
        .replace(rfooter, footerSrc)
        .replace(rsidebar, sidebarSrc)
        .replace(ritem, params.item || 1)
}

function handleSSI(src) {
    var rp = /\<\!\-\-#include\s+virtual=(['"])+(.*)\1\s+-->/g
    src = src.replace(rp, function(origin, sp, path) {
        var res = ""
        path = path.replace("/prd/", "/src/").replace(/^\//, "")
        if (utils.path.exists(path)) {
            res += compileHTML(path)
            utils.logger.log("Request " + path + " Success")
        }
        return res
    })
    return src
}
//加载versions.mapping文件,在使用qdr发布时qdr会自动下载此文件
function loadVersionMapping() {
    var verfile = utils.path.exists("./ver/versions.mapping") ? utils.file.io.read("./ver/versions.mapping") : '';
    var arr = verfile.split('\n');
    if (arr.length > 0) {
        versionMapping = {};
    }
    for (var i in arr) {
        var item = arr[i];
        if (item.indexOf('#') > -1) {
            var result = item.split('#');
            if (result.length > 0) {
                versionMapping[result[0]] = result[1];
            }
        }
    }
    console.log('versionMapping', versionMapping)
    return versionMapping;
}
//替换{{version}}标签为md5值
function replaceVerMap(src) {
    if (src.indexOf('{{version}}') == -1) return src;
    src = src.replace(/(prd)[^\"]+@{{version}}[^\"]+/g, function(word) {
        var key = word.substring(4, word.indexOf('@'));
        var extName = word.match(/\.[a-zA-Z]+$/);
        var md5 = versionMapping[key + extName];
        if (!md5) {
            utils.logger.error("没有找到对应的md5值", key + extName, md5);
            return word;
        }
        utils.logger.log("替换{{version}}标签", key + extName);
        return word.replace('{{version}}', md5)
    })
    return src;
}
