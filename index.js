var _ = require('lodash');
var prog = require('commander');
var fileSave = require('file-save');
var allin_html = require('allin');
var path = require('path');
var Q = require('q');

var build = require('./lib/build');
var init = require('./lib/init');
var get = require('./lib/get');
var read= require('./lib/read');

/*
*	Create
*	Create initial files and folders, under a directory.
*	@param {string} dir - directory install canner
*	@param {string} generator - Inital generate the generator that you are finding
*/
exports.create= function (dir, generator) {
	generator = generator || null;
    dir = dir || process.cwd();

    return init(dir, generator);
}

/*
*	Build
*	Build a canner from a canner.json
*	@param {string} dir - source to canner.json, default ./canner.json
*	@param {object} options - options
*/
exports.build= function (dir, options) {
	return build.folder(dir, options, false)
}

/*
*	Watch
*	Watching any changes in a canner and recompiled
*	@param {string} dir - source to canner.json, default ./canner.json
*	@param {object} options - options
*/
exports.watch= function (dir, options) {
	return build.folder(dir, options, true)
}

/*
*	Allin
*	Make html include files all warp allin
*	@param {string} htmlfile - source to your html, default ./index.html
*	@param {object} options - options
*/

exports.allin= function (htmlfile, options) {
	var options = {
      "minifyCSS": true,
      "minifyJS": true,
      "removeComments":true,
      "collapseWhitespace": true
    };

    var filename = options.filename || 'output.html';
    var output = options.output || './';
    var minify = options.minifyall || null;

    if(!minify) {
      options = null;
    }

    allin_html(
    	path.resolve(process.cwd(), htmlfile),
    	options,
    	function(all) {
      		fileSave(path.resolve(path.join(process.cwd(), output, filename)))
        	.write(all);
    	});
}

/*
* read
* read a file path
* @param {string} can - can name, e.g., sample-can
* @param {string} filePath - file path you want to read
*/

exports.read= function (can, filePath) {
  return read(can, filePath);
}
