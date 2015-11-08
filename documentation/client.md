
## Using the Client

- [Purpose of the Client](client.md#Purpose of the Client)
- [Getting Started](client.md#Getting Started)
- [Creating a Resource](client.md#Creating a Resource)
- [Finding Resources](client.md#Finding Resources)
- [Getting a Resource](client.md#Getting a Resource)

#### Purpose of the Client

1. To enable consumption of multiple JSON:API services.
2. To be a factory for Resource objects.
  1. When creating new Resources.
  2. When retrieving Resource from an API.

#### Getting Started

First up, if you're working in a browser you'll need to drop the library onto your page:

```html
<script type="text/javascript" src="jsonapi-client.min.js"></script>
```

From here on, the implementation (be it in NodeJS or the browser) is the same.
Start by pulling in the library:

```javascript
var JsonapiClient = require("jsonapi-client");
```

Next, we create a new instance of jsonapi-client and tell it where our target API is located:

```javascript
var client = new JsonapiClient("http://localhost:16006/rest");
```

Now we're good to go!

#### Creating a Resource

Creating a resource begins with a synchronous call to `client.create` - it will immediately return a new (empty) instance of a [Resource](resource.md). Next up is an opportunity to set the attributes on your new resource, for example you'll need to assign values to all mandatory attributes before trying to push it up to the remote API.

```javascript
var newResource = client.create("resource-type"); // synchronous
```

Once the newResource is populated and ready to be pushed, it needs to be `sync`d. You can read more about `sync` in the [Resource documentation](resource.md).

```javascript
newResource.sync(function(err) { /* accepts a callback */ });
newResource.sync(); // without a callback, it returns a promise
```

#### Finding Resources

To search for resources, use `client.find`. The first argument must be the resource-type you want to search for. The second argument is optional, it represents any URL parameters you may want to include - filter, include, sort, etc. The third argument is an optional callback. If no callback is provided, a promise will be returned.

The function will produce either an [error](error.md) or an array of [Resources](resource.md).

```javascript
var optionalParams = { /* url-params go here */ };
client.find("resource-type", optionalParams, function(err, resources) { });
client.find("resource-type", optionalParams); // without a callback, it returns a promise
```

#### Getting a Resource

To find a specific resource, use `client.get`. The first argument must be the resource-type you want to search for. The second argument must be the resource-id of the resource you want to retrieve from the remote API. The third argument is optional, it represents any URL parameters you may want to include - filter, include, sort, etc. The fourth argument is an optional callback. If no callback is provided, a promise will be returned.

The function will produce either an [error](error.md) or a single [Resource](resource.md).

```javascript
var optionalParams = { /* url-params go here */ };
client.get("resource-type", "resource-id", optionalParams, function(err, resources) { });
var promise = client.get("resource-type", "resource-id", optionalParams);
```
