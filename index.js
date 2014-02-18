'use strict';

var glob = require('glob'),
    lingo = require('lingo'),
    en = lingo.en;

var actions = {
  list    : { verb : 'get'                  },
  create  : { verb : 'post'                 },
  show    : { verb : 'get' , singular: true },
  update  : { verb : 'put' , singular: true },
  destroy : { verb : 'del' , singular: true }
};

module.exports = function(server, options) {
  options = options || {};
  options.files = options.files || '**/*.js';
  options.cwd = options.cwd || './routes';

  function buildPath(path, singular) {
    return path.split('/').map(function(node, i, all) {
      return node + (singular || i < all.length - 1 ? '/:' + en.singularize(node) : '');
    }).join('/');
  }

  // construct routes
  glob.sync(options.files, options).forEach(function(file) {
    var route = require(options.cwd + '/' + file);

    for (var action in actions) {
      if (!route[action]) continue;

      var path = buildPath(file.slice(0, -3), actions[action].singular),
          verb = actions[action].verb,
          versions, index;

      // see if we have defined any versioning
      if (route.versions && route.versions[action]) {
        // use specified actions for specified versions
        versions = route.versions[action];
        for (index in versions) {
          if (!versions.hasOwnProperty(index)) continue;
          server[verb]({ path: path, version: versions[index].versions }, route[versions[index].method]);
        }
      } else {
        // use default for current version/s
        server[verb](path, route[action]);
      }
    }
  });
};
