# Peer Review API


## Overview 

The API will use a consistent pattern across resources. Plural resources will
return take arrays of resources or single objects, and will return arrays or
null.  Singular resources will take single objects and return single objects or
null.  We will use five of the HTTP verbos: GET, POST, PUT, PATCH, and DELETE.

Each resource will have 10 possible routes: one for each of the five verbs for
each of the pural and singular definition of the resource.  Optional special
case routes include a query route and an upload route. 

In cases where a resource is entirely dependent on another resource (but not a
child of that resource such that it would be returned with every request),
nested routes will be used.  IE. `GET /parent/:id/dependents`  The same
structure applies to the children.

Not all routes will be defined for all resources.  Where routes are not
defined, they'll return `501`.

### GET /resources 

Get all instances of that resource in the database, fully populated.

**Request Body** None.

**Returns** An array of instances, or an empty array.

**Errors**
- Returns 500 and `{ error: 'server-error' }` in the event of a server error.

### POST /resources

Create one or more new resources.

**Request Body** A single object instance, or an array of object instances.

**Returns** The newly created resource instances as a single object instance,
or an array of object instances.

**Errors** 
- Returns 500 and `{ error: 'server-error' }` in the event of a server error.
- Returns 400 and an appropriate `{ error: 'type' }` if any of the resources are malformed.


### PUT /resources

Overwrite one or more resources and their children.  Children will be deleted
from the database before new children on the sent resources are added in.

**Request Body** A single object instance or an array of object instances, with
id defined.  If the resource has children, they will be overwritten as well.

**Returns** The modified resource instances as a single object instance, or an
array of object instances.

**Errors** 
- Returns 500 and `{ error: 'server-error' }` in the event of a server error.
- Returns 400 and `{ error: 'missing-id' }` if one or more objects are missing ids.

### PATCH /resources

Merge one or more resources.  Id field must be defined on each resource.
Children are unaffected and any children sent are ignored.

**Request Body** A single object or an array of object instances.  Must have id
and at least one other field defined.

**Returns** The modified resource instances as a single object instance, or an
array of object instances.

**Errors**
- Returns 500 and `{ error: 'server-error' }` in the event of a server error.

### DELETE /resources

**Undefined for now**.  If the HTTP specification is updated to allow `DELETE`
methods to include a body, we'll use this to allow multiple deletion.

### GET /resource/:id

Returns the instance of the resource identified by `:id` from the database. 

**Request Body** None.

**Returns** A single fully populated resource.

**Errors**
- Returns 404 and null if there are no resources identified by that id.
- Returns 500 and `{ error: 'server-error' }` in the event of a server error.

### POST /resource/:id

Overwrite the resource at `:id`.  Overwrites any children by deleting them from
the database and then adding the children sent with the request body. A synonym
of `PUT /resource/:id`.

**Request Body** A fully populated resource.

**Returns** The modified resource.

**Errors**
- Returns 404 and null if there is no resource identified by `:id`.
- Returns 400 and an appropriate `{ error: 'type' }` in the event of a malformed resource.
- Returns 500 and `{ error: 'server-error' }` in the event of a server error.

### PUT /resource/:id

Overwrite the resource at `:id`. Overwrites the children by deleting them from
the database and then inserting the children sent with the request body.
Synonym of `POST /resource/:id`.

**Request Body** A fully populated resource.

**Returns** The modified resource as a single fully populated resource instance.

**Errors**
- Returns 404 and null if there is no resource identified by `:id`.
- Returns 400 and an appropriate `{ error: 'type' }` in the event of a malformed resource.
- Returns 500 and `{ error: 'server-error' }` in the event of a server error.

### PATCH /resource/:id

Takes a partial resource and merges it with the database. Ignores children.

**Request Body** A single partial resource.  `:id` does not have to be
populated.

**Returns** The modified resource as a single fully populated resource
instance. 

**Errors**
- Returns 404 and null if there is no resource identified by `:id`.
- Returns 400 and an appropriate `{ error: 'type' }` in the event of a malformed resource.
- Returns 500 and `{ error: 'server-error' }` in the event of a server error.


### DELETE /resource/:id

Deletes the resource identified by `:id`.  Also deletes any children.

**Request Body** None.

**Returns** The id of the deleted resource.

**Errors**
- Returns 404 and null if there is no resource identified by `:id`.
- Returns 500 and `{ error: 'server-error' }` in the event of a server error.

### POST /resource/:id/upload

Upload a file to resources where this is relevant.

**Request Body** The uploaded file as Form Data.

**Returns** The modified resource with the filepath defined.

**Errors**
- Returns 404 and null if there is no resource defined by `:id`.
- Returns 400 and an appropriate `{ error: 'type' }` with a malformed resource.
- Returns 500 and `{ error: 'server-error' }` on a server error.

### GET /resources/query?...

Perform a query on the resource using the parameters sent in the query string.

**Request Body** None.

**Returns** An array of resources, ordered by the query.

**Errors**
- Returns 400 an appropriate `{ error: 'type' }` on a malformed query string.
- Returns 500 and `{ error: 'server-error' }` on a server error.

## Resources

- [Users](./users.md)
- [Authentication](./authentication.md)
- [Papers](./papers.md)
- [Reviews](./reviews.md)
- [Fields](./fields.md)
