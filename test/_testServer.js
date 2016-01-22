"use strict";

var jsonApiTestServer = require("jsonapi-server/example/server.js");
if (!jsonApiTestServer.start) return;

before(function() {
  jsonApiTestServer.start();
});
after(function() {
  jsonApiTestServer.close();
});
