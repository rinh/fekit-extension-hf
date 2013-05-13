require('date-utils');
var fs = require('fs')
var syspath = require('path')
var baselib = syspath.join( module.parent.filename , '../' )
var utils = require( syspath.join( baselib , 'util'  ) )
var minCode = require( syspath.join( baselib , 'commands/min' ) ).minCode

var VER = new Date().toFormat('YYYYMMDDHH24MISS')

exports.usage = "处理header&footer项目编译使用";

exports.set_options = function( optimist ){

    return optimist
}

exports.run = function( options ){

    var reg = /src\/.*?\/.*.html$/;

    utils.path.each_directory( process.cwd() , function( path ){ 
        if( reg.test( path ) ) {
            build_file( path );
        }
    } , true );

    utils.logger.log('done.')

}

function build_file( path ) {
    var src = compileHTML( path ) 
    var prdfile = path.replace('/src/','/prd/');
    utils.file.mkdirp( utils.path.dirname( prdfile ) )
    utils.file.io.write( prdfile , src )
    utils.logger.log( path + " done." )
}

function compileHTML( path ) {

    var result = [];

    var basePath = utils.path.dirname( path );

    var htmlSrc = utils.file.io.read( path )

    htmlSrc = grep( htmlSrc , 'space' )

    htmlSrc = grep( htmlSrc , 'ver' )

    htmlSrc = grep( htmlSrc , 'html' , function( path ){
        var f = combine_path( basePath , path );
        return compileHTML( f )
    })

    htmlSrc = grep( htmlSrc , 'js' , function( path ){
        var f = combine_path( basePath , path );
        return minCode( ".js" , utils.file.io.read( f ) )
    })    

    htmlSrc = grep( htmlSrc , 'css' , function( path ){
        var f = combine_path( basePath , path );
        return minCode( ".css" , utils.file.io.read( f ) , { noSplitCSS : true } )
    })    

    return htmlSrc;

}


function grep( src , type , cb ) {

    switch( type ) {

        case "space":
            return src.replace( /\s{2,}/g , " " )
        case "ver":
            return src.replace( /\{\{ver\}\}/g , VER )
        case "js":
            return src.replace( /\{\{js (.*?)\}\}/g , function($0, $1){
                return cb($1);
            });
        case "css":
            var _src = src.replace( /\{\{css (.*?)\}\}/g , function($0, $1){
                return cb($1);
            });
            return fix_Matrix( _src );
        case "html":
            return src.replace( /\{\{html (.*?)\}\}/g , function($0, $1){
                return cb($1);
            });

    }

}


function combine_path( basePath , filePath ) {
    if( utils.path.exists( filePath ) ) {
        return filePath;
    } else {
        var full = utils.path.join( basePath , filePath );
        if( utils.path.exists( full ) ) {
            return full
        }
    }
    throw "[ERROR]路径不存在。 " + basePath + " " + filePath;
}


function fix_Matrix( src ) {

    var reg = /DXImageTransform.Microsoft.Matrix.*?\)/ig
    return src.replace( reg , function($0){
        return $0.replace(/,/g,', ');
    })

}