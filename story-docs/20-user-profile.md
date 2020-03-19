# 20 - Users can Edit Profile 
[Issue 20](https://github.com/danielbingham/peerreview/issues/20)

## UX Research
**Author:** danielbingham

*What is the proposed UX?  This should include any UX/UI designs, mocks, and prototypes.*

We're not really going to worry too much about the UX here.  We might introduce some basic styling.

## What are we doing?
**Author:** danielbingham

*How do we plan to solve this story? This should include a detailed plan of attack with architecture prototypes, designs, and a description of any proposed code changes.*

Install React Router and create initial configuration.

- RegistrationForm should be on route `/register`
- User profile should be on route `/users/:id/:display-name`

Create a UserProfile component.

- Display the user's name and email.
    - We can leave providing the ability to change name, email, and password to a future story.  For now, lets just get router and display in place.

Update the RegistrationForm component to use ReactRouter to send the user to
the `/users/:id/display-name` profile route in the `onSubmit` action.

## What are the alternatives?
**Author:** danielbingham

*What are the alternative solutions we considered, but ultimately decided against?*

No obvious ones, we could try to do with out routing, but that doesn't make
sense for this app.  We could explore alternatives to ReactRouter, but that
seems to be the standard.

## What are we not doing?
**Author:** danielbingham

*Is there anything we explicitly decided not to pursue as part of this story?  Why?*

Providing a way to change the UserProfile.

## What tests do we need?
**Author:** danielbingham

*Outline what unit, integration, and e2e tests we plan to write for this story.*

A unit test for UserProfile which confirms that it displays the data
appropriately.
