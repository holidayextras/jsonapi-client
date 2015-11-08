
## Errors

- [Purpose of Errors](client.md#Purpose of Errors)
- [Error properties](client.md#Error properties)

#### Purpose of Errors

1. To represent remote Errors.
1. To enable graceful fallback.
1. To conform to Javascript standards.

#### Error properties

* `name` - A high level summary of what went wrong.
* `message` - A more detailed message of specifically what went wrong.
* `status` - The HTTP response code, useful for distinguishing between user errors or API bugs.
* `code` - Useful for debugging the remote API, should assist development teams to track down bugs.

```javascript
> console.log(someError);
{ [Requested resource does not exist: "There is no people with id 5e7b30d5-c8da-4936-9f81-4a6ea1153a5f"]
  name: 'Requested resource does not exist',
  status: '404',
  code: 'ENOTFOUND' }
```
