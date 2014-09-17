var path = require('path'),
    argv = require("optimist").boolean("optimist").argv,
    package = require(path.join(__dirname, 'package.json'));

var config = {
  "version": package.version,
  "port": 8765,
  "fallbackExt": ['scss', 'sass', 'less', 'styl', 'coffee'],
  "autoParse": ['md'],
  "rootDir": process.cwd()
};

if(argv.h || argv.help){
  console.log([
    "usage: jsserv-dev [path] [options]",
    "",
    "options:",
    "  -p              Port to use [8765]",
    "  -d              Directory [./]",
    "  -h --help       Print this list exit."
  ].join("\n"));
  process.exit();
}

console.log('Current version', config.version);

if(argv.p){
  config.port = argv.p;
}
if(argv.d){
  config.rootDir = argv.d;
}

module.exports = config;
