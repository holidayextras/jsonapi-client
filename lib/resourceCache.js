/* @flow weak */
"use strict";
module.exports = function createResourceCache(options) {
  options = options || { };
  var resourceCache = {};

  resourceCache._cacheDuration = options.cacheDuration || 5000;

  if (typeof module === undefined) {
    resourceCache._cacheDuration = null;
  }
  resourceCache._cache = { };
  resourceCache._cacheList = [ ];

  resourceCache.get = function(someResource) {
    var key = someResource._getUidString();
    return resourceCache._cache[key];
  };

  resourceCache.set = function(someResource) {
    someResource._associateWithAll(resourceCache._cacheList);

    var key = someResource._getUidString();
    resourceCache._cache[key] = someResource;
    resourceCache._cacheList.push(someResource);

    if (!resourceCache._cacheDuration) return;

    setTimeout(function() {
      resourceCache.removeFromCache(someResource);
    }, resourceCache._cacheDuration);
  };

  resourceCache.removeFromCache = function(someResource) {
    var key = someResource._getUidString();
    resourceCache._cache[key] = undefined;
    var i = resourceCache._cacheList.indexOf(someResource);
    resourceCache._cacheList.splice(i, 1);
  };

  return resourceCache;
};
