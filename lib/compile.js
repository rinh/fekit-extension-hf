 var Handlebars = handlebars = require('handlebars');
 var layouts = require('handlebars-layouts');
 var fs = require('fs');
 var path = require('path');
 require('date-utils');
 var uglifyjs = require('uglify-js');
 var uglifycss = require('uglifycss');
 var hfPath = '';
 
 var vermap = versionMapping = false;
 //全局配置
 var parentConfig = {}
 var isDebug = false;
 var isServer =false;
 var util = require('./util.js');

 function compile(options) {
     hfPath = options.hfPath;
     isDebug = options.isDebug;
     isServer = options.isServer;
     
     vermap=options.vermap;

     var fileName = options.fileName;
     var channel = options.channel;
     currPath = hfPath + '/src/' + channel;
     var enterFilePath = path.join(hfPath, 'src/', channel, fileName + '.html');
     if (!fs.existsSync(enterFilePath, 'utf-8')) {
         util.logger.error('文件不存在', enterFilePath);
         return '';
     }
     if (!fs.existsSync(hfPath + '/config.js')) {
         util.logger.error('未找到配置文件', hfPath + '/config.js');
         return;
     }
     try {
         parentConfig = require(hfPath + '/config.js').getConfig();
     } catch (e) {
         util.logger.error('读取配置文件错误', hfPath + 'config.js');
         return
     }

     var config = {};
     if (fs.existsSync(currPath + '/config.js')) {
         try {
             config = require(currPath + '/config.js').getConfig(parentConfig);
         } catch (e) {
             util.logger.error('读取配置文件错误', currPath + '/config.js');
             return false;
         }
     } else {
         config = parentConfig;
     }
     config.channel = channel;
     config.fileName = fileName;

     Handlebars.registerHelper('html', function(filePath, options) {
         if (typeof filePath == 'undefined') return '';
         var str = fs.readFileSync(path.join(currPath, filePath), 'utf-8');
         var t = handlebars.compile(str);
         var result = t(config);
         if (!isDebug)
             result = result.replace(/\s{2,}/g, " ")
         return result
     });
     Handlebars.registerHelper('type', function(filePath, options) {
         return channel;
     });
     Handlebars.registerHelper('ver', function(filePath, options) {
         var VER = new Date().toFormat('YYYYMMDDHH24MISS')
         return VER;
     });
     Handlebars.registerHelper('js', function(filePath, options) {
         if (typeof filePath == 'undefined') return '';
         var str = fs.readFileSync(path.join(currPath, filePath), 'utf-8');
         var t = handlebars.compile(str);
         var result = t(config);
         if (!isDebug)
             result = uglifyjs.minify(result, {
                 fromString: true
             }).code.replace(/;?$|;?\s*$/, ";");

         return result

     });
     Handlebars.registerHelper('css', function(filePath, options) {
         if (typeof filePath == 'undefined') return '';
         var str = fs.readFileSync(path.join(currPath, filePath), 'utf-8');
         var t = handlebars.compile(str);
         var result = t(config);
         if (!isDebug)
             result = uglifycss.processString(result);
         return result
     });
    
     handlebars.registerHelper(layouts(handlebars));
     var a = fs.readdirSync(hfPath + '/src/common/layout/');
     //注册模板
     a.forEach(function(item, index) {
         var fileName = item.replace('.html', '');
         handlebars.registerPartial(fileName, fs.readFileSync(hfPath + '/src/common/layout/' + item, 'utf8'));
     })

     var indexStr = fs.readFileSync(enterFilePath, 'utf-8');
     var template = handlebars.compile(indexStr);
     var result = template(config);
     if(!isServer)
        result = replaceVerMap(result);

     //压缩html
     if (!isDebug)
         result = result.replace(/\s{2,}/g, " ")
     delete require.cache[require.resolve(hfPath + '/config.js')]
     return result;
 } 
 //替换{{version}}标签为md5值
 function replaceVerMap(src) {
     if (src.indexOf('{version}') == -1) return src;
 
     src = src.replace(/(prd)[^\"]+@{version}[^\"]+/g, function(word) {
         var key = word.substring(4, word.indexOf('@'));
         var extName = word.match(/\.[a-zA-Z]+$/);
         var md5 = vermap[key + extName];
         if (!md5) {
             util.logger.error("没有找到对应的md5值", key + extName, md5);
             return word.replace('{version}', 'VERSION');
         }
         return word.replace('{version}', md5)
     })
     return src;
 }
 module.exports = compile;
