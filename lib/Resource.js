/* @flow weak */
"use strict";
var Resource = module.exports = function(rawResource, client) {
  rawResource = rawResource || { };
  return this._construct(rawResource, client);
};

var Promise = require("promise");
// Promise.denodeify = function(a) { return a; };
var assign = require("object-assign");

function getMeta(obj) {
  var metaDefaults = { relation: "primary" };
  return obj.meta || metaDefaults;
}

Resource.prototype._construct = function(rawResource, client) {
  this._raw = rawResource;
  this._base = {
    id: rawResource.id,
    type: rawResource.type
  };
  this._client = client;
  this._changed = [ ];

  if (!this._base.id) return this;

  var fromCache = client._resourceCache.get(this);
  if (fromCache) return fromCache;

  client._resourceCache.set(this);
  return this;
};

Resource.prototype._checkIsResource = function(resource) {
  if (resource instanceof Resource) {
    if (!resource._base.id) throw new Error("Resource has not been created remotely, it can't be assigned to a relationship!");
    return;
  }


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
  if (typeof relationships != 'undefined') {
    Object.keys(relationships).forEach(function (i) {
      if (getMeta(relationships[i]).relation === "foreign") return;
      primaryRelations[i] = relationships[i];
    });
  }
  return {
    id: this._base.id,
    type: this._base.type,
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

Resource.prototype._relationHasResource = function(relationName, resource) {
  var relation = this[relationName];

  if (relation instanceof Array) {
    relation = relation.filter(function(i) {
      return (i._base === resource._base);
    }).pop();
  }

  return !!relation;
};

Resource._rawRelationHasMany = function(rawRelation) {
  var meta = getMeta(rawRelation);
  if (meta.relation === "primary") return (rawRelation.data instanceof Array);
  return meta.many;
};

Resource.prototype._associateWith = function(resource) {
  var self = this;
  var relationships = self._getRaw().relationships;
  if (!relationships) return;
  Object.keys(relationships).forEach(function(relationName) {
    var rawRelation = relationships[relationName];
    var otherRelation = resource;
    var rawRelationData = rawRelation.data;
    var rawRelationMeta = getMeta(rawRelation);
    if (rawRelationMeta.relation === "foreign") {
      if (rawRelationMeta.belongsTo !== resource._getBase().type) {
        return;
      }
      otherRelation = self;
      rawRelationData = resource._getRaw().relationships[rawRelationMeta.as].data;
    }

    var match = !![].concat(rawRelationData).filter(function(dataItem) {
      // should null ever get here?
      return dataItem && otherRelation._matches(dataItem);
    }).pop();
    if (!match) return;

    if (Resource._rawRelationHasMany(rawRelation)) {
      if (self._relationHasResource(relationName, resource)) return;
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

  if (!self._base.id) {
    rawRelation = this._raw.relationships[relationName] = {
      meta: { _trust: true },
      links: { },
      data: null
    };
  }

  if (!rawRelation) {
    throw new Error("Relationship " + relationName + " on " + this._raw.type + " does not exist!");
  }

  if (getMeta(rawRelation).relation === "foreign") {
    throw new Error("Relationship " + relationName + " on " + this._raw.type + " is a foreign relation and cannot be updated from here!");
  }

  return {
    add: function(resource) {
      return self._addRelation(relationName, rawRelation, resource);
    },
    set: function(resource) {
      return self._setRelation(relationName, rawRelation, resource);
    },
    remove: function(resource) {
      return self._removeRelation(relationName, rawRelation, resource);
    }
  };
};
Resource.prototype._addRelation = function(relationName, rawRelation, resource) {
  this._checkIsResource(resource);
  if (rawRelation.meta && rawRelation.meta._trust) {
    delete rawRelation.meta;
    rawRelation.data = [ ];
  }
  if (!Resource._rawRelationHasMany(rawRelation)) {
    throw new Error("Relationship " + relationName + " on " + this._raw.type + " is a not a MANY relationship and cannot be added to!");
  }
  if (this._relationHasResource(relationName, resource)) return this;
  rawRelation.data.push(resource._getBase());
  this[relationName] = this[relationName] || [];
  this[relationName].push(resource);
  resource._tweakLinksTo("add", this);
  return this;
};
Resource.prototype._removeRelation = function(relationName, rawRelation, resource) {
  this._checkIsResource(resource);
  if (rawRelation.meta && rawRelation.meta._trust) {
    delete rawRelation.meta;
    rawRelation.data = [ ];
  }
  if (Resource._rawRelationHasMany(rawRelation)) {
    rawRelation.data = rawRelation.data.filter(function(id) {
      return !resource._matches(id);
    });
    this[relationName] = this[relationName].filter(function(id) {
      return !resource._matches(id);
    });
    resource._tweakLinksTo("remove", this);
  } else {
    rawRelation.data = undefined;
    this[relationName] = undefined;
  }
  resource._tweakLinksTo("remove", this);
  return this;
};
Resource.prototype._setRelation = function(relationName, rawRelation, resource) {
  this._checkIsResource(resource);
  rawRelation.data = resource._getBase();
  this[relationName] = resource;
  resource._tweakLinksTo("add", this);
  return this;
};

Resource.prototype.toJSON = function() {
  var theirs = this._raw;
  var theirResource = assign({
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
  var theirResource = assign({
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
  return this;
};

Resource.prototype.fetch = Promise.denodeify(function(relationName, options, callback) {
  var self = this;

  if (typeof options === "function") {
    callback = options;
    options = { };
  }

  self._client._getRelated(this, relationName, options, function(err, newResources) {
    if (!newResources) return callback("No related resources found");

    if (!(newResources instanceof Array)) {
      self._raw.relationships[relationName].data = newResources._getBase();
      return callback(err, newResources);
    }

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
    return callback(null, self);
  });
});

Resource.prototype.delete = Promise.denodeify(function(callback) {
  var self = this;
  self._client._delete(self, function(err) {
    if (err) return callback(err);

    self._client._resourceCache.removeFromCache(self);
    self._getBase().id = null;
    self._getRaw().id = null;

    return callback();
  });
});

Resource.prototype._tweakLinksTo = function(method, resource) {
  var self = this;
  if (!self._raw.relationships) return;
  Object.keys(self._raw.relationships).forEach(function(i) {
    var someRawRelationship = self._raw.relationships[i];
    var someRawRelationshipMeta = getMeta(someRawRelationship);
    if (someRawRelationshipMeta.relation !== "foreign") return;
    if (someRawRelationshipMeta.belongsTo !== resource._raw.type) return;

    self["_" + method + "LinksTo"](i, resource, someRawRelationshipMeta.many);
  });
};

Resource.prototype._removeLinksTo = function(i, resource) {
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

Resource.prototype._addLinksTo = function(i, resource, many) {
  if (this[i] instanceof Array) {
    this[i].push(resource);
  } else {
    if (many) {
      this[i] = [resource];
    } else {
      this[i] = resource;
    }
  }
};
