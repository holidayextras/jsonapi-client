[![Coverage Status](https://coveralls.io/repos/holidayextras/jsonapi-client/badge.svg?branch=master)](https://coveralls.io/r/holidayextras/jsonapi-client?branch=master)
[![Build Status](https://travis-ci.org/holidayextras/jsonapi-client.svg?branch=master)](https://travis-ci.org/holidayextras/jsonapi-client)
[![Code Climate](https://codeclimate.com/github/holidayextras/jsonapi-client/badges/gpa.svg)](https://codeclimate.com/github/holidayextras/jsonapi-client)
[![Dependencies Status](https://david-dm.org/holidayextras/jsonapi-client.svg)](https://david-dm.org/holidayextras/jsonapi-client)

# jsonapi-client

`jsonapi-client` is a module designed to make it really easy to consume a `json:api` service.

This module is tested against the example JSON:API server in [jsonapi-server](https://github.com/holidayextras/jsonapi-server).

### Full documentation

- [Using the Client](documentation/client.md)
- [Interacting with Resources](documentation/resource.md)
- [Resource Interning](documentation/resource-interning.md)

### The tl;dr

#### Creating a new Client
```javascript
var JsonapiClient = require("jsonapi-client");
var client = new JsonapiClient({
  url: "http://localhost:16006/rest"
});
```

#### Creating a new Resource
```javascript
var article = client.create("articles");
article.set("title", "foobar");
article.sync(function(err) {
  console.log("Resource created");
});
```

#### Finding Resources
```javascript
client.find("articles", function(err, resources) {
  resources.map(function(resource) {
    console.log(resource.toJSON());
  });
});
```

#### Getting a specific Resource
```javascript
client.get("articles", 5, { include: [ "author" ] }, function(err, article) {
  console.log(article.toJSONTree());
});
```

#### Fetching a Resource's related Resource
```javascript
article.fetch("author", function(err) {
  console.log(article.author.toJSON());
});
```

#### Updating a Resource's primary relationships
```javascript
article.relationships("comments").add(comment);
article.sync(function(err) {
  console.log("Resource's relation updated");
});
```

#### Deleting a Resource
```javascript
article.delete(function(err) {
  console.log("Resource deleted");
});
```
