require('date-utils');
var fs = require('fs-extra');
var syspath = require('path');
//var url = require('url')
//var querystring = require('querystring')
//var child_process = require('child_process')
var baselib = syspath.join(module.parent.filename, '../')
var utils = require(syspath.join(baselib, 'util'));
var webserver = require('./lib/webserver'); //webserver测试 fekit hf -s
var hfpackage = require('./lib/package'); //直接打包fekit hf 

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
    isDebug = !!options.debug;
    options.hfPath = process.cwd();
    if (options.server)
        return webserver.start(options);
    else {
        if (!utils.path.exists("./ver/versions.mapping")) {
            throw new Error('未获取到./ver/versions.mapping 请确认qzz tagname是否正确');
        }
        loadVersionMapping()
        options.vermap = vermap || false
        hfpackage.execute(options);
        utils.logger.log('done.')
        return;
    }
}
//加载versions.mapping文件,在使用qdr发布时qdr会自动下载此文件
function loadVersionMapping() {
    var verfile = utils.path.exists("./ver/versions.mapping") ? utils.file.io.read("./ver/versions.mapping") : '';
    var arr = verfile.split('\n');
    if (arr.length > 0) {
        vermap = {};
    }
    for (var i in arr) {
        var item = arr[i];
        if (item.indexOf('#') > -1) {
            var result = item.split('#');
            if (result.length > 0) {
                vermap[result[0]] = result[1];
            }
        }
    }
    return vermap;
}
