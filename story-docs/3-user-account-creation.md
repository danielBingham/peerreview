## What are we doing?
**Author:** danielbingham

*How do we plan to solve this story? This should include a detailed plan of attack with prototypes, designs, and a description of any proposed code changes.*

Our users need to be able to create accounts.  We need to provide them a form
to do this, and create the backing API routes.

For the API routes, just use a simple raw SQL call and return the resulting
JSON data.  No need to worry about a model on the backend for now.

For the users, create the following endpoints:

`GET /users` - Return all user data.
`GET /user/[id]` - Return the user data for user with [id], minus the password.
We can define an authentication URL in a future story.
`POST /users` - Create a new user from the post data. Minus the password.
Return the user's ID.
`POST /user/[id]/password` - Set the password for the user with [id].
`PUT /user/[id]` - Replace the user with [id] from the post data.
`PATCH /user/[id]` - Update the user with [id] from the posted data.
`DELETE /user/[id]` - Delete the user with [id]

On the front end, we'll need to create a new component, `UserRegistrationForm`
which displays a registration form to new users:

```
Name: ___________________
Email: __________________
Password: _______________
Confirm Password: _______
|Register|
```

We're going to need to get Redux setup on the frontend, since we haven't done
that yet, as well as the React Redux bindings.  We can install Redux and React
Redux by running:

```
$ npm install redux
$ npm install react-redux
$ npm install --save-dev redux-devtools
```

We're also going to want to use Redux Thunk middleware to interact with the api.

```
$ npm install redux-thunk
```

We can deal with React Router in a future story.  For now, lets limit this
story to getting Redux set up and working with React and our API.

We're going to need to get the initial boilerplate setup and define some
initial actions.  For now, lets define state as just users:

```
{
    users: {
        1: {
            email: '',
            name: ''
        }
    }
}
```

We don't want to store the passwords in state, so we'll need two actions that
we can call.  One to create the user in state, and another that's purely async
that updates the password on the backend.

So we'll need the following actions:

```
const CREATE_USER = 'CREATE_USER';

const POST_USER = 'POST_USER';
const POST_USER_PASSWORD = 'POST_USER_PASSWORD';

const REGISTER_USER = 'REGISTER_USER';
```

`CREATE_USER` take the id, name, and email and update local state
with them.

`POST_USER` hit the `POST /users` route of the API with the name and email, get
the ID back, and then call `CREATE_USER`.  Will fail if there's another user
registered with the same `email`.

`POST_USER_PASSWORD` we'll hit the `POST /user/[id]/password` endpoint with the
password to set for that user.

`REGISTER_USER` will call `POST_USER` first, and then `POST_USER_PASSWORD` on
`POST_USER` success.

For now, we'll just have the form display "Success" after it has succeeded.


## What are the alternatives?
**Author:**  danielBingham

*What are the alternative solutions we considered, but ultimately decided against?*

Well, we could use something other than React/Redux, but this seems to be the
popular pattern these days, so tally-ho!

We could also expand scope to include more than just the registration form, but
lets stay with small chunks.

## What are we not doing?
**Author:**

*Is there anything we explicitly decided not to pursue as part of this story?  Why?*

We're not writing the login form, we're not worrying about React Router, not
doing any kind of user list.
