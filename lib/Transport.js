/* @flow weak */
"use strict";
var Transport = module.exports = function(path, auth) {
  auth = auth || { };
  this._construct(path, auth);
};

var request = require("superagent");
var qs = require("qs");

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

Transport._defaultError = function(response) {
  return {
    status: "500",
    code: "EUNKNOWN",
    title: "An unknown error has occured",
    detail: response
  };
};

Transport.prototype._action = function(method, url, data, callback) {
  // console.log(method, url, JSON.stringify(data, null, 2));
  var someRequest = request[method](url);
  someRequest.set("Content-Type", "application/vnd.api+json");
  this._attachAuthToRequest(someRequest);
  if (method === "get") {
    someRequest = someRequest.query(qs.stringify(data));
  } else {
    someRequest = someRequest.send(data || {});
  }
  someRequest.end(function(err, payload) {
    // console.log("=>", err, payload);
    if (err) {
      // console.log(err.response.text);
      if (err.status === 401) {
        return callback(new Error("401 Unauthorized"));
      }

      var response;
      try {
        response = JSON.parse(err.response.text);
      } catch(e) {
        console.error("Transport Error: " + JSON.stringify(err));
        return callback(Transport._defaultError(response));
      }

      if (!Array.isArray(response.errors)) {
        console.error("Invalid Error payload!", response);
        return callback(Transport._defaultError(response));
      }

      var realErrors = response.errors.map(function(apiError) {
        var someError = new Error(JSON.stringify(apiError.detail));
        someError.name = apiError.title;
        // $FlowFixMe: Technically "status" isn't a field on Error
        someError.status = apiError.status;
        // $FlowFixMe: Technically "code" isn't a field on Error
        someError.code = apiError.code;

        return someError;
      });

      return callback(realErrors[0]);
    }

    if (payload.statusCode == 204) {
      return callback(null, payload.req, payload.req._data.data, payload.req._data.included);
    }

    if (!payload.body) {
      try {
        payload.body = JSON.parse(payload.text);
      } catch(e) {
        return callback(Transport._defaultError(payload));
      }
    }

    if (!payload.body) {
      return callback(Transport._defaultError(payload));
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

Transport.prototype.fetch = function(resource, relation, options, callback) {
  var url = resource._getPathFor(relation);
  this._action("get", url, options, callback);
};

Transport.prototype.create = function(resource, callback) {
  var url = this._path + "/" + resource._getBase().type;
  var postData = resource._getRaw();
  delete postData.id;
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
