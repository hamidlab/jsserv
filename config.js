var path = require('path'),
    argv = require("optimist").boolean("optimist").argv,
    package = require(path.join(__dirname, 'package.json'));

var config = {
  "version": package.version,
  "port": 8765,
  "fallbackExt": ['jade', 'scss', 'sass', 'less', 'styl', 'coffee'],
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
    "  -h --help       Print this list exit.",
    "  -S --ssl        Enable https.",
    "  -s --silent     Suppress log messages from output",
    "  -C --cert       Path to ssl cert file (default: cert.pem).",
    "  -K --key        Path to ssl key file (default: key.pem).",
  ].join("\n"));
  process.exit();
}

console.log('Current version : ', config.version);

if(argv.p){
  config.port = argv.p;
}
if(argv.d){
  config.rootDir = argv.d;
}
config.silent = argv.s || argv.silent;
config.ssl = !!argv.S;

config.https = {
  cert: argv.C || path.join(__dirname, 'assets/keys/cert.pem'),
  key: argv.K || path.join(__dirname, 'assets/keys/key.pem')
};

module.exports = config;


