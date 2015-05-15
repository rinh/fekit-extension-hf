var fs = require('fs');
var syspath = require('path')
var url = require('url')
var querystring = require('querystring')
var baselib = syspath.join( module.parent.parent.filename , '../' )
var utils = require( syspath.join( baselib , 'util'  ) )
var minCode = require( syspath.join( baselib , 'commands/_min_mincode' ) ).minCode

var KEYWORDS = ['.q_header', '.qhf_', '@', 'require'];
var reg = /\}([\s\S]*?)\{/g;
var mediaReg = /@media(.*?)\{(.*?)\}(.*?)\}/g


exports.checkRules = function (path) {
    utils.logger.log('开始检查: ', path);
    var styles = getStyles(path);

    return checkTagName(path, styles.originClass) && checkStartWord(path, styles.classNames);
}

function getStyles(path) {
    var content = minCode( ".css" , utils.file.io.read(path) , { noSplitCSS : true }); // 先压缩css，确保格式化
    content = parseMediaStyle(content)
    var firstClass = content.substr(0, content.indexOf('{'));
    var ret = {
        classNames: {},
        originClass: []
    };

    var classNames = content.match(reg);
    if (!classNames) return ret;
    classNames.unshift(firstClass);

    classNames.forEach(function(item){
        item = item.replace('{', '').replace('}', '');
        ret.originClass.push(item);

        var arr = item.split(','); // 拆分 .a .b, .c .d
        arr.forEach(function(cns){
            var arr1 = cns.split(' '); // 拆分.a .b
            arr1.forEach(function(cn){
                if (!ret.classNames[cn] && cn.indexOf('.') === 0) {
                    ret.classNames[cn] = 1;
                }
            });
        });

    });

    return ret;
}


function parseMediaStyle(content) {
    var firstLeftBrace, lastRightBrace, media, mediaStyles, _i, _len;
    mediaStyles = content.match(mediaReg);
    if (mediaStyles !== null) {
      for (_i = 0, _len = mediaStyles.length; _i < _len; _i++) {
        media = mediaStyles[_i];
        firstLeftBrace = media.indexOf('{');
        lastRightBrace = media.lastIndexOf('}');
        content = content.replace(media, media.substring(firstLeftBrace + 1, lastRightBrace));
      }
    }
    return content;
  };

function checkStartWord(path, classNames) {
    
    var checkResult = true;

    for (item in classNames) {
        if (classNames.hasOwnProperty(item)) {
            // 检查.开头的样式，如.a 
            if (isStrartWithDot(item)) {                 
                if (!isStartWithKeyword(item)) {
                    utils.logger.error('文件', path, '里存在不是', 
                        KEYWORDS.join(','), '开头的样式：', item);
                    checkResult = false;
                }
            }
        }
    }

    return checkResult;

}

function isStartWithKeyword(str) {
    var ret = false;
     KEYWORDS.forEach(function(keyword) {
        if (str.indexOf(keyword) === 0) {
            ret = true;
        }
    });
    return ret;
}

function checkTagName(path, originClass) {
    var ret = true;

    originClass.forEach(function(styleLine) {
        var arr = styleLine.split(',');
        arr.forEach(function(style) {
            var k = style.split(' ');
            for(var i = 0, len = k.length; i < len; i++) {
                if (!isStrartWithDot(k[i])) {
                    if (!isStartWithKeyword(k[0])) {
                        ret = false;
                        utils.logger.error('文件', path, 
                            '里存在没有命名空间或命名空间不是', 
                            KEYWORDS.join(','), '开头的标签：', k[i]);
                    }
                }
            }
        });
    });

    return ret;
}

function isStrartWithDot(str) {
    return str.indexOf('.') === 0;
}