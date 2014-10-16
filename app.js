"use strict";

var path = require('path'),
    mmm = require('mmmagic'),
    magic = new mmm.Magic(mmm.MAGIC_MIME),
    watch = require('node-watch'),
    sass = require('node-sass'),
    less = require('less'),
    coffee = require('coffee-script'),
    jade = require('jade'),
    markdown = require("markdown").markdown,
    stylus = require('stylus'),
    config = require(path.join(__dirname, 'config.js')),
    url = require('url'),
    fs = require('fs');

process.stdin.on('data', function(key){
  if(key == "c\n"){
    console.log("Server stopped.".grey);
    process.exit();
  }
  if(key == "clear\n"){
    process.stdout.write('\u001B[2J\u001B[0;0f');
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
  getMime: function(fileName){
    var ext = fileName.split('.').pop();
    if(!ext) return false;
    switch(ext){
      case 'css':
        return 'text/css';
        break;
      case 'js':
      case 'json':
        return 'application/javascript';
        break;
      case 'html':
        return 'text/html'
    }
    return false;
  },
  getFileContent: function(fileName, callback) {
    var _this = this;
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
              'mime': _this.getMime(fileName) || frSplit[0],
              'type': frSplit[1].split('=')[1],
              'status': 200
            };
            callback(false, data);
          }catch(e){
            throw e;
            callback(true);
          }
        }
      });
    }catch(e){
      callback(true);
      return false;
    }
  },
  parseContent: function(file, type, callback) {
    switch(type){
      case 'sass':
      case 'scss':
        sass.render({
          file: file,
          success: function(css){
            callback(false, css, 'text/css');
          },
          error: function(e){
            console.log('error'.red, e);
            callback(true);
          }
        });
        break;
      case 'styl':
        stylus(data).render(function(err, css){
          callback(err, css, 'text/css');
        });
        break;
      case 'less':
        var parser = new(less.Parser)({
          paths: [config.root],
          filename: file
        });
        var data = "";
        parser.parse(data, function(e, tree){
          if(e){
            callback(true);
          }else{
            callback(false, tree.toCSS({
              compress: true
            }), 'text/css');
          }
        });
        break;
      case 'coffee':
        this.getFileContent(file, function(err, data){
          callback(false, coffee.compile(data.data.toString()), 'application/javascript');
        });
        break;
      case 'jade':
        callback(false, jade.renderFile(file, {}), 'text/html');
        break;
      case 'md':
        var data = "";
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
  },
  run: function(res, data){
    res.writeHead(data['status'], {"Content-Type": data['mime']});
    res.write(data['data'], data['type']);
    res.end();
  },
  createServer: function(req, res){
    var pathname = url.parse(req.url).pathname.replace(/^\//, '');
    var fileName = this.getFile(path.join(config.rootDir, pathname));
    var fallbackFile = fileName? false : (this.getFallbackFile(path.join(config.rootDir, pathname)));
    var _this = this;

    this.getFileContent(fileName || fallbackFile['file'], function(err, fileData){
      if(err) {
        fileData = {
          'data': jade.renderFile(path.join(__dirname, 'views/404.jade')),
          'type': false,
          'mime': 'text/html',
          'status': 404
        };
        _this.listDir(path.join(config.rootDir, pathname), function(err, dirData){
          if(!err){
            fileData['data'] = dirData;
            fileData['status'] = 200;
          }
          _this.run(res, fileData);
        });
      }else{
        var fileSplits = (fileName || fallbackFile['file']).split('.');
        var ext = fileSplits[fileSplits.length-1];
        if(fallbackFile || config.autoParse.indexOf(ext) >= 0){
          _this.parseContent((fileName || fallbackFile['file']), fallbackFile['type'] || ext, function(err, data, type){
            if(!err){
              fileData['data'] = data;
              fileData['mime'] = type;
              fileData['type'] = false;
            }
            _this.run(res, fileData);
          });
        }else{
          _this.run(res, fileData);
        }
      }
    });
  }
}

module.exports = new Jsserv();

