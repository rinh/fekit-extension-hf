 var fs = require('fs-extra');
 var path = require('path');

 var toolPath = path.parse(module.filename).dir;
 var compile = require('./compile.js');
 var util = require('./util.js');
 var blackList = ['common', '.DS_Store'];

 module.exports.execute = function(opts) {
     var hfPath = opts.hfPath;

     var hfPath_src = path.join(hfPath, 'src')
     var hfPath_prd = path.join(hfPath, 'prd')

     var dirs = fs.readdirSync(hfPath + '/src');
     if (!fs.existsSync(hfPath + '/prd'))
         fs.mkdirSync(hfPath + '/prd')
     else
         fs.removeSync(hfPath + '/prd/*');

     for (var i in dirs) {
         var dir = dirs[i];
         if (contains(blackList, dir))
             continue;
         var files = fs.readdirSync(path.join(hfPath, 'src', dir));
         if (files.length > 0) {
             fs.mkdirSync(path.join(hfPath_prd, dir));
         }
         for (var j in files) {
             var file = files[j];
             var fileAbPath = path.join(hfPath_prd, dir, file)

             if (file.indexOf('.html') > -1) {
                 util.logger.log(fileAbPath);
                 var result = compile({
                     channel: dir,
                     hfPath: opts.hfPath,
                     toolPath: toolPath,
                     fileName: file.replace('.html', ''),
                     vermap: opts.vermap
                 });
                 if (result)
                     fs.writeFileSync(path.join(hfPath_prd, dir, file), result);
             }
         }
     }

 }

 function contains(a, obj) {
     for (var i = 0; i < a.length; i++) {
         if (a[i] === obj) {
             return true;
         }
     }
     return false;
 }
