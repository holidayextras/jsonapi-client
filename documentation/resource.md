
### Interacting with Resources

Foreword: All resource objects are [interned](resource-interning.md).

- [Examining resource attributes](#examining-resource-attributes)
- [Setting resource attributes](#setting-resource-attributes)
- [Syncing a resource with the remote service](#syncing-a-resource-with-the-remote-service)
- [Flattening a resource](#flattening-a-resource)
- [Debugging nested resources](#debugging-nested-resources)
- [Fetching related resources](#fetching-related-resources)
- [Changing resource relations](#changing-resource-relations)
- [Deleting a resource](#deleting-a-resource)

#### Examining resource attributes

Resource attributes should be accessed via `resource.get()`.

```javascript
resource.get("attribute-name");
```

### Setting resource attributes

Resource attributes should be modified via `resource.set()`.

```javascript
resource.set("attribute-name", "new-value");
```

### Syncing a resource with the remote service

To push either a new resource, or changes to an existing resource, up to the remote API, use `resource.sync()`.

```javascript
newPerson.sync(function(err) { /* accepts a callback */ });
newPerson.sync(); // without a callback, it returns a promise
```

### Flattening a resource

Calling `resource.toJSON()` will flatten and merge a Resource's type+id, attributes and relations to give a clean view of the resource. Nested or known related resources will be excluded.

```javascript
> photo.toJSON();
{
  id: "aab14844-97e7-401c-98c8-0bd5ec922d93",
  type: "photos",
  title: "Matrix Code",
  url: "http://www.example.com/foobar",
  height: 1080,
  width: 1920,
  photographer: { type: "people", id: "ad3aa89e-9c5b-4ac9-a652-6670f9f27587" }
}
```

### Debugging nested resources

Calling `resource.toJSONTree()` will produce an extended version of `resource.toJSON()` whereby known nested resources will be included.

```javascript
> client.find("people", { include: "articles", filter: { lastname: "Rumbelow"}}, function(err, people) {
  console.log(people[0].toJSONTree());
});
{
  "id": "cc5cca2e-0dd8-4b95-8cfc-a11230e73116",
  "type": "people",
  "firstname": "Oli",
  "lastname": "Rumbelow",
  "email": "oliver.rumbelow@example.com",
  "articles": [
    {
      "id": "de305d54-75b4-431b-adb2-eb6b9e546014",
      "type": "articles",
      "title": "NodeJS Best Practices",
      "content": "na",
      "author": "[Circular]",
      "tags": [
        {
          "type": "tags",
          "id": "7541a4de-4986-4597-81b9-cf31b6762486"
        }
      ],
      "photos": [],
      "comments": [
        {
          "type": "comments",
          "id": "3f1a89c2-eb85-4799-a048-6735db24b7eb"
        }
      ]
    }
  ],
  "photos": null
}
```

### Fetching related resources

To easily retrieve related resources, call `resource.fetch("relation-name")`. This does a couple of things:

1. Fetches related resources via the `related` link, as per the JSON:API spec.
2. Creates instances of Resource for each new resource.
3. Assigns forward links.
4. Assigns backward links.

```javascript
people.fetch("relation-name", function(err, newResources) { /* accepts a callback */ });
people.fetch("relation-name"); // without a callback, it returns a promise

photo.fetch("photographer", function(err, person) {
  person instanceof Resource;
  photo.photographer == person;
  person.photos.indexOf(photo) !== -1;
});
```

### Changing resource relations

A resource's relations can be modified by calling `resource.relationships("relation-name")` and then calling `.add()`, `.remove()` or `.set()` to mutate the relation.

```javascript
person.relationships("photos").add(someResource) // synchronous
person.relationships("photos").remove(someResource) // synchronous
person.relationships("photos").set(someResource) // synchronous
```

After mutating the relation, the resource needs to be `.sync()`d to push the changes to the remote API.

### Deleting a resource

To delete a resource from the remote API use `resource.delete()`. Calling delete will remove the id from the local resource, retaining all other resource state. A deleted resource can therefore be re-`sync()`d under a new resource id.

```javascript
resource.delete(function(err) { /* accepts a callback */ });
resource.delete(); // without a callback, it returns a promise
```
