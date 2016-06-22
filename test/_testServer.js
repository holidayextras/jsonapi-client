"use strict";

var jsonApiTestServer = require("jsonapi-server/example/server.js");
if (!jsonApiTestServer.start) return;

jsonApiTestServer.getExpressServer().use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

before(function() {
  jsonApiTestServer.start();
});
after(function() {
  jsonApiTestServer.close();
});
