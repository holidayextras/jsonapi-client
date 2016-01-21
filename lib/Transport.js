"use strict";
var Transport = module.exports = function(path, auth) {
  auth = auth || { };
  this._construct(path, auth);
};

var request = require("superagent");
var Perry = require('perry');

Transport.prototype._construct = function(path, auth) {
  this._path = path;
  this._auth = {
    cookie: auth.cookie,
    header: auth.header
  };
};

Transport.prototype._attachAuthToRequest = function(someRequest) {
  if (this._auth.cookie) {
    var cookieName = Object.keys(this._auth.cookie)[0];
    someRequest.set("Cookie", cookieName + "=" + this._auth.cookie[cookieName]);
  }

  if (this._auth.header) {
    var headerName = Object.keys(this._auth.header)[0];
    someRequest.set(headerName, this._auth.header[headerName]);
  }
};

Transport.prototype._action = function(method, url, data, callback) {
  // console.log(method, url, JSON.stringify(data, null, 2));
  var someRequest = request[method](url);
  this._attachAuthToRequest(someRequest);
  if (method === "get") {
    someRequest = someRequest.query(Perry.stringify(data));
  } else {
    someRequest = someRequest.send(data);
  }
  someRequest.end(function(err, payload) {
    // console.log("=>", err, JSON.stringify(JSON.parse(payload.text), null, 2));
    if (err) {
      // console.log(err.response.text);
      if (err.status === 401) {
        return callback(new Error("401 Unauthorized"));
      }

      var response;
      try {
        response = JSON.parse(err.response.text);
      } catch(e) {
        return callback(new Error("Invalid response from server"));
      }

      var realErrors = response.errors.map(function(apiError) {
        var someError = new Error(JSON.stringify(apiError.detail));
        someError.name = apiError.title;
        someError.status = apiError.status;
        someError.code = apiError.code;

        return someError;
      });

      return callback(realErrors[0]);
    }

    if (!payload.body) {
      payload.body = JSON.parse(payload.text);
    }

    return callback(null, payload.body, payload.body.data, payload.body.included);
  });
};

Transport.prototype.search = function(type, options, callback) {
  var url = this._path + "/" + type;
  this._action("get", url, options, callback);
};

Transport.prototype.find = function(type, id, options, callback) {
  var url = this._path + "/" + type + "/" + id;
  this._action("get", url, options, callback);
};

Transport.prototype.fetch = function(resource, relation, callback) {
  var url = resource._getPathFor(relation);
  this._action("get", url, { }, callback);
};

Transport.prototype.create = function(resource, callback) {
  var url = this._path + "/" + resource._getBase().type;
  this._action("post", url, {
    data: resource._getRaw()
  }, callback);
};

Transport.prototype.update = function(resource, callback) {
  var url = this._path + "/" + resource._getBase().type + "/" + resource._getBase().id;
  this._action("patch", url, {
    data: resource._getDelta()
  }, callback);
};

Transport.prototype.delete = function(resource, callback) {
  var url = this._path + "/" + resource._getBase().type + "/" + resource._getBase().id;
  this._action("del", url, null, callback);
};
