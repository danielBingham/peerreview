# Entity:Action Permission System

JournalHub uses an Entity:Action permission system where `action` is granted to
`user` on `entity`. This has a number of benefits and some costs. 

The benefits are:

* Querying for permissions is fast, cheap, and easy.
* High level of flexibility in terms of what `action` we can define. Eg. `identify`
* Enables user defined permission models.

The costs are:

* Granting permissions is difficult and expensive.  We need to make sure we're thorough.

## The Entities

The top level entities are defined by the controller/DAO combinations. Any
entity that has both a controller and DAO is considered a top-level entities.
Permissions can also be granted to sub-entities using `:` as a separator.  For
example, to grant a permission on a Paper Author entity, you would use
`Paper:author`. Top level entities are always capitalized, while sub-entities
are always lower case.

Currently, the top level entities are:

* Field
* File
* Journal
* JournalSubmission
* Notification
* PaperComment
* Paper
* PaperEvent
* PaperVersion
* Review
* Token
* User

## Actions

The actions that may be granted correspond to the basic CRUD actions
and enable each of the REST endpoints.

They are:

* `create` enabling `POST`
* `read` enabling `GET`
* `update` enabling `PATCH`
* `delete` enabling `DELETE`

Additional actions that don't correspond to the basic CRUD are:

* `identify` allowing a user to identify an anonymous individual
