"use strict";
var Resource = module.exports = function(rawResource, client) {
  rawResource = rawResource || { };
  return this._construct(rawResource, client);
};

var Promise = require("promise");
// Promise.denodeify = function(a) { return a; };
var _ = require("lodash");
var resourceCache = require("./resourceCache.js");

Resource.prototype._construct = function(rawResource, client) {
  this._raw = rawResource;
  this._base = {
    id: rawResource.id,
    type: rawResource.type
  };
  this._client = client;
  this._changed = [ ];

  if (!this._base.id) return this;

  var fromCache = resourceCache.get(this);
  if (fromCache) return fromCache;

  resourceCache.set(this);
  return this;
};

Resource.prototype._checkIsResource = function(resource) {
  if (resource instanceof Resource) return;

  var type = typeof resource;
  if (resource.constructor) type = resource.constructor.name;

  throw new Error("Expected Resource, got " + type);
};

Resource.prototype._getBase = function() {
  return this._base;
};

Resource.prototype._getRaw = function() {
  return this._raw;
};

Resource.prototype._getDelta = function() {
  var primaryRelations = { };
  var relationships = this._getRaw().relationships;
  Object.keys(relationships).forEach(function(i) {
    if (relationships[i].meta.relation === "foreign") return;
    primaryRelations[i] = relationships[i];
  });

  return {
    attributes: this._getRaw().attributes,
    relationships: primaryRelations
  };
};

Resource.prototype._getUid = function() {
  return this._base.id;
};

Resource.prototype._getUidString = function() {
  return this._base.id + "/" + this._base.type;
};

Resource.prototype._getPathFor = function(relation) {
  return this._getRaw().relationships[relation].links.related;
};

Resource.prototype._matches = function(other) {
  return (this._base.id === other.id) && (this._base.type === other.type);
};

Resource.prototype._associateWithAll = function(resources) {
  var self = this;
  resources.forEach(function(resource) {
    self._associateWith(resource);
    resource._associateWith(self);
  });
};

Resource.prototype._associateWith = function(resource) {
  var self = this;
  Object.keys(self._getRaw().relationships).forEach(function(relationName) {
    var relation = self._getRaw().relationships[relationName];

    var otherRelation = resource;
    var relationData = relation.data;
    if (relation.meta.relation === "foreign") {
      if (relation.meta.belongsTo !== resource._getBase().type) {
        return;
      }
      otherRelation = self;
      relationData = resource._getRaw().relationships[relation.meta.as].data;
    }

    var match = !![].concat(relationData).filter(function(dataItem) {
      // should null ever get here?
      return dataItem && otherRelation._matches(dataItem);
    }).pop();
    if (!match) return;

    if (relation.meta.many) {
      self[relationName] = self[relationName] || [ ];
      self[relationName].push(resource);
    } else {
      self[relationName] = resource;
    }
  });
};

Resource.prototype.relationships = function(relationName) {
  var self = this;
  var rawRelation = this._raw.relationships[relationName];

  if (!rawRelation) {
    throw new Error("Relationship " + relationName + " on " + this._raw.type + " does not exist!");
  }

  if (rawRelation.meta.relation === "foreign") {
    throw new Error("Relationship " + relationName + " on " + this._raw.type + " is a foreign relation and cannot be updated from here!");
  }

  return {
    add: function(resource) {
      self._addRelation(relationName, rawRelation, resource);
    },
    set: function(resource) {
      self._setRelation(relationName, rawRelation, resource);
    },
    remove: function(resource) {
      self._removeRelation(relationName, rawRelation, resource);
    }
  };
};
Resource.prototype._addRelation = function(relationName, rawRelation, resource) {
  this._checkIsResource(resource);
  if (!rawRelation.data instanceof Array) {
    throw new Error("Relationship " + relationName + " on " + this._raw.type + " is a not a MANY relationship and cannot be added to!");
  }
  rawRelation.data.push(resource._getBase());
  this[relationName] = this[relationName] || [];
  this[relationName].push(resource);
  resource._tweakLinksTo("add", relationName, this);
};
Resource.prototype._removeRelation = function(relationName, rawRelation, resource) {
  this._checkIsResource(resource);
  if (rawRelation.data instanceof Array) {
    rawRelation.data = rawRelation.data.filter(function(id) {
      return !resource._matchesId(id);
    });
    this[relationName] = this[relationName].filter(function(id) {
      return !resource._matchesId(id);
    });
    resource._tweakLinksTo("remove", relationName, this);
  } else {
    rawRelation.data = undefined;
    this[relationName] = undefined;
  }
  resource._tweakLinksTo("remove", relationName, this);
};
Resource.prototype._setRelation = function(relationName, rawRelation, resource) {
  this._checkIsResource(resource);
  rawRelation.data = resource._getBase();
  this[relationName] = resource;
  resource._tweakLinksTo("add", relationName, this);
};

Resource.prototype.toJSON = function() {
  var theirs = this._raw;
  var theirResource = _.assign({
    id: theirs.id,
    type: theirs.type
  }, theirs.attributes);
  for (var i in theirs.relationships) {
    theirResource[i] = theirs.relationships[i].data;
  }
  return theirResource;
};

Resource.prototype.toJSONTree = function(seen) {
  seen = seen || [ ];
  if (seen.indexOf(this) !== -1) return "[Circular]";
  seen.push(this);
  var theirs = this._raw;
  var theirResource = _.assign({
    id: theirs.id,
    type: theirs.type
  }, theirs.attributes);
  for (var i in theirs.relationships) {
    if (this[i] instanceof Array) {
      theirResource[i] = this[i].map(function(j) { // eslint-disable-line
        return j.toJSONTree(seen);
      });
    } else if (this[i] instanceof Resource) {
      theirResource[i] = this[i].toJSONTree(seen);
    } else {
      theirResource[i] = theirs.relationships[i].data || null;
    }
  }
  return theirResource;
};

Resource.prototype.get = function(attibuteName) {
  return this._raw.attributes[attibuteName];
};

Resource.prototype.set = function(attributeName, value) {
  this._raw.attributes[attributeName] = value;
  this._changed.push(attributeName);
};

Resource.prototype.fetch = Promise.denodeify(function(relationName, callback) {
  var self = this;
  self._client._getRelated(this, relationName, function(err, newResources) {
    self._raw.relationships[relationName].data = newResources.map(function(someResource) {
      return someResource._getBase();
    });
    return callback(err, newResources);
  });
});

Resource.prototype.sync = Promise.denodeify(function(callback) {
  var self = this;
  var target = self._client._update;
  if (!self._getBase().id) {
    target = self._client._remoteCreate;
  }

  target.call(self._client, self, function(err, rawResponse, rawResource) {
    if (err) return callback(err);
    self._construct(rawResource, self._client);
    return callback();
  });
});

Resource.prototype.delete = Promise.denodeify(function(callback) {
  var self = this;
  self._client._delete(self, function(err) {
    if (err) return callback(err);

    resourceCache.removeFromCache(self);
    self._getBase().id = null;
    self._getRaw().id = null;

    return callback();
  });
});

Resource.prototype._tweakLinksTo = function(method, relationName, resource) {
  var self = this;
  Object.keys(self._raw.relationships).forEach(function(i) {
    var someRawRelationship = self._raw.relationships[i];
    if (someRawRelationship.meta.relation !== "foreign") return;
    if (someRawRelationship.meta.as !== relationName) return;

    self["_" + method + "LinksTo"](i, relationName, resource);
  });
};

Resource.prototype._removeLinksTo = function(i, relationName, resource) {
  if (this[i] instanceof Array) {
    this[i] = this[i].filter(function(j) {
      return j !== resource;
    });
  } else {
    if (this[i] === resource) {
      this[i] = undefined;
    }
  }
};

Resource.prototype._addLinksTo = function(i, relationName, resource) {
  if (this[i] instanceof Array) {
    this[i].push(resource);
  } else {
    this[i] = resource;
  }
};
