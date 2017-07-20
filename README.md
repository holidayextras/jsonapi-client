[![Coverage Status](https://coveralls.io/repos/holidayextras/jsonapi-client/badge.svg?branch=master&service=github)](https://coveralls.io/github/holidayextras/jsonapi-client?branch=master)
[![Build Status](https://travis-ci.org/holidayextras/jsonapi-client.svg?branch=master)](https://travis-ci.org/holidayextras/jsonapi-client)
[![Code Climate](https://codeclimate.com/github/holidayextras/jsonapi-client/badges/gpa.svg)](https://codeclimate.com/github/holidayextras/jsonapi-client)
[![Codacy Badge](https://api.codacy.com/project/badge/grade/3998acb1f4c6433a93a688e9523e37e0)](https://www.codacy.com/app/oliver-rumbelow-github/jsonapi-client)
[![Dependencies Status](https://david-dm.org/holidayextras/jsonapi-client.svg)](https://david-dm.org/holidayextras/jsonapi-client)

# jsonapi-client

A javascript module designed to make it really easy to consume a `json:api` service.

** ⚠ !! THIS PROJECT IS IN NPM AS `@holidayextras/jsonapi-client` !! **

```
$ npm install --save @holidayextras/jsonapi-client
```

note: this project requires a Node.js version of at least `4.5.0`.

### Motivation / Justification / Rationale

Consuming a json:api service from within Javascript is a non-trivial affair. Setting up a transport mechanism, authentication, making requests to standardised HTTP routes, error handling, pagination and expanding an inclusion tree... All of these things represent barriers to consuming an API. This module takes away all the hassle and lets developers focus on interacting with a rich API without wasting developer time focusing on anything other than shipping valuable features.

This module is tested against the example json:api server provided by  [jsonapi-server](https://github.com/holidayextras/jsonapi-server).

### Full documentation

- [Using the Client](documentation/client.md)
- [Interacting with Resources](documentation/resource.md)
- [Resource Interning](documentation/resource-interning.md)

### The tl;dr

#### In a browser
```html
<script src="/dist/jsonapi-client.min.js"></script>
<script type="text/javascript">
  var client = new JsonapiClient("http://localhost:16006/rest", {
    header: {
      authToken: "2ad1d6f7-e1d0-480d-86b2-dfad8af4a5b3"
    }
  });
</script>
```

#### Creating a new Client
```javascript
var JsonapiClient = require("jsonapi-client");
var client = new JsonapiClient("http://localhost:16006/rest", {
  header: {
    authToken: "2ad1d6f7-e1d0-480d-86b2-dfad8af4a5b3"
  }
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

#### A more complex example
```javascript
}).then(function() {
  return client.create("articles")
    .set("title", "some fancy booklet")
    .set("content", "oh-la-la!")
    .relationships("tags").add(someTagResource)
    .sync();
}).then(function(newlyCreatedArticle) {
```
