var fs = require('fs');
var path = require('path');

var Q = require('q');
var _ = require('lodash');
var fs_save = require('file-save');
var async = require('async');
var YAML = require('yamljs');

var md = require('./markdown');
var engine = require('./engine');

// reading canner.json
var _readSettings = function(settings) {

	var canner;

	return _readJSON(settings).then(function(data) {
		canner = data;
		if(canner instanceof Array) {
			return canner
		}else {
			return [canner]
		}
	}, function(err) {
		console.error('Can\'t find no canner.json file.');
		console.error(err);
		process.exit(2);
	})
}

// Reading canner.json file.
var _readJSON = function(settings) {
	var d = Q.defer();
	var ext = path.extname(settings).toLowerCase();

	if(ext === '.yaml' || ext === '.yml') {
		// yaml, yml
		fs.readFile(path.join(settings), {encoding: 'UTF-8'}, function(err, data) {
			if (err) {
				d.reject(new Error(err));
			} else {
				try{
					var data = YAML.parse(data);
				}catch(e) {
					console.error('Your canner configuration file canner.yml or canner.yaml parse error.')
					console.error(e);
					process.exit(1);
				}
				d.resolve(data);
			}
		});

	}else if(ext == '.js') {
		// js
		var data= require(path.resolve(settings));
		d.resolve(data);
	}else if(ext === '.json'){
		// json
		fs.readFile(path.join(settings), {encoding: 'UTF-8'}, function(err, data) {
			if (err) {
				d.reject(new Error(err));
			} else {
				//parse
				try {
					data = JSON.parse(data);
				}catch(e) {
					console.error('Your canner configuration file canner.json parse error.')
					console.error(e);
					process.exit(1);
				}

				d.resolve(data);
			}
		});
	}else {
		d.reject(new Error('Setting file format is not support'));
	}

	return d.promise;
}


// Reading layout.
var _setLayout = function(dir, layout) {
	var d = Q.defer();
	var layoutPath = path.resolve(dir, layout);

	fs.readFile(layoutPath, {encoding: 'UTF-8'}, function(err, layout) {
		if (err) {
			d.reject(new Error(err));
		} else {
			d.resolve(layout);
		}
	})

	return d.promise;
}



// gnerating docs
var doc = function(output, settings, tmp_engine, _data) {
	var dir = path.dirname(settings);

	return _readSettings(settings).then(function(settings) {
			var count = 0;
			var tasks= settings.map(function (page) {
				if(page.filename) {
					var filename = page.filename
				}else {
					if(count !== 0) {
						var filename = 'index' + count + '.html';
					}else {
						var filename = 'index.html';
					}
					count++;
				}

				return Q.fcall(function() {
					return _setLayout(dir, page.layout);
				})

				.then(function(data) {
					// rendering layout with content.
					var content = _data || page.data;
					var layout = data;

					if(tmp_engine === 'hbs' || tmp_engine === 'handlebars') {
						var helpers = page.helpers;
						return engine.hbsLayout(content, layout, dir, helpers);
					}else if(tmp_engine === 'nunjucks') {
						return engine.nunLayout(content, layout, dir);
					}else if(tmp_engine === 'jade') {
						return engine.jadeLayout(content, layout, dir);
					}else if(tmp_engine === 'swig') {
						return engine.swigLayout(content, layout, dir);
					}else if(tmp_engine === 'mustache'){
						return engine.musLayout(content, layout, dir);
					}else if(tmp_engine === 'dust') {
						return engine.dustLayout(content, layout, dir);
					}

				}, function(err) {
					console.error(err);
					process.exit(3);
				})

				.then(function(layout) {
					return md(layout, dir)
				}, function(err) {
					console.error(err);
					process.exit(4);
				})

				.then(function(build) {
					var deferred = Q.defer();
					var fs_path = path.join(output, filename);

					if(_data)
						return build;

					fs_save(fs_path)
						.write(build)
						.end()
						.finish(function() {
							console.log('file save to ' + fs_path);
							deferred.resolve();
						})
					return deferred.promise;
				}, function(err) {
					console.error(err);
					process.exit(5)
				})
			})

			return Q.all(tasks)
	})

}


module.exports = {
	doc: doc
}
