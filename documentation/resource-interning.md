
### Resource Interning

*Resource Interning ONLY applies when running within a web browser!*

Suppose your application fetches a specific resource from the remote API, lets call that resource A. At some point further down the line, another part of your application does a broad search which results in a list of resources, whereby that list contains A. Resource interning ensures that all local resources representing the same unique remote resource are all the same object.

Here's an example of it in action:
```javascript
var person1, person2;

// Get Mark's record
client.get("people", "d850ea75-4427-4f81-8595-039990aeede5", { }, function(err1, personResource) {
  person1 = personResource;
});

// Find Mark's record
client.get("people", { filter: { firtsname: "Mark" } }, function(err1, personResource) {
  person2 = personResource;
});

// Wait for both requests to complete
setTimeout(function() {
  // both objects will contain the SAME reference
  assert.equal(person1,  person2);
}, 1000);
```
