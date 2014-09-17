"use strict";

var path = require('path'),
    mmm = require('mmmagic'),
    magic = new mmm.Magic(mmm.MAGIC_MIME),
    sass = require('node-sass'),
    less = require('less'),
    coffee = require('coffee-script'),
    jade = require('jade'),
    markdown = require("markdown").markdown,
    stylus = require('stylus'),
    config = require(path.join(__dirname, 'config.js')),
    fs = require('fs');

process.stdin.on('data', function(key){
  if(key == "c\n"){
    console.log("Server stopped.".grey);
    process.exit();
  }
});
process.on('SIGINT', function() {
  console.log("Server stopped.".grey);
  process.exit();
});

function Jsserv(){}

Jsserv.prototype = {
  listDir: function(dirName, next) {
    try{
      var files = fs.readdirSync(dirName);
      if(!files) {
        next(true);
      }else{
        next(false, jade.renderFile(path.join(__dirname, 'views/dir-list.jade'), {
          files: files,
          dirName: dirName.replace(config.rootDir, '').replace(/\/$/, '')
        }));
      }
    }catch(e){
      //throw e;
      next(true);
    }
  },
  getFile: function(filepath) {
    var fStat;
    try{
      fStat = fs.statSync(filepath);
      if(fStat.isFile()){
        return filepath;
      }else if(fStat.isDirectory()){
        return this.getFile(path.join(filepath, 'index.html')) ||
               this.getFile(path.join(filepath, 'index.htm'));
      }
    }catch(e){}
    return false;
  },
  getFallbackFile: function(filepath) {
    try{
      var parentDir = filepath.split('/');
      var urlFile = parentDir.pop().split('.');
      parentDir = parentDir.join('/');
      if(fs.statSync(parentDir)){
        var ext = urlFile.pop();
        urlFile = urlFile.join('.');
        if(urlFile){
          for(var i=0, l = config.fallbackExt.length; i<l; i++){
            var file = this.getFile(path.join(parentDir, urlFile+'.'+config.fallbackExt[i]));
            if(file){
              return {
                'type': config.fallbackExt[i],
                'file': file
              };
              break;
            }
          }
        }
      }
    }catch(e){}
    return false;
  },
  getFileContent: function(fileName, callback) {
    var result;
    if(!fileName) {
      callback(true);
      return false;
    }
    try {
      var fileContent = fs.readFileSync(fileName);
      magic.detect(fileContent, function(err, fileResult) {
        if(err){
          callback(true);
        }else{
          try{
            var frSplit = fileResult.split('; ');
            var data = {
              'data': fileContent,
              'mime': frSplit[0],
              'type': frSplit[1].split('=')[1],
              'status': 200
            };
            callback(false, data);
          }catch(e){
            callback(true);
          }
        }
      });
    }catch(e){
      callback(true);
      return false;
    }
  },
  parseContent: function(data, type, callback) {
    switch(type){
      case 'sass':
      case 'scss':
        sass.render({
          data: data,
          success: function(css){
            callback(false, css, 'text/css');
          },
          error: function(){
            callback(true);
          }
        });
        break;
      case 'styl':
        stylus(data).render(function(err, css){
          callback(err, css);
        });
        break;
      case 'less':
        less.render(data, function(e, css){
          if(e){
            callback(true);
          }else{
            callback(false, css, 'text/css');
          }
        });
        callback(data, 'text/css');
        break;
      case 'coffee':
        callback(false, coffee.compile(data), 'application/javascript');
        break;
      case 'jade':
        callback(false, jade.render(data, {}), 'text/html');
        break;
      case 'md':
        try{
          var pageContent = jade.renderFile(path.join(__dirname, 'views/markdown.jade'), {
            markdownHTML: markdown.toHTML(data),
            markdown: data
          });
          callback(false, pageContent, 'text/html');
        }catch(e){
          callback(false, markdown.toHTML(data), 'text/html');
        }
        break;
      default:
        callback(false);
    }
  }
}

module.exports = new Jsserv();

