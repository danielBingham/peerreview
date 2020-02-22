# Issue 18 - Build Initial Unit Tests 
[Issue 18](https://github.com/danielbingham/peerreview/issues/18)

## UX Research
**Author:** danielbingham

*What is the proposed UX?  This should include any UX/UI designs, mocks, and prototypes.*

No UX for this story.

## What are we doing?
**Author:** danielbingham

*How do we plan to solve this story? This should include a detailed plan of attack with architecture prototypes, designs, and a description of any proposed code changes.*

- Set up the test harness using Mocha, Chai, and Sinon.
- Write a unit test for the RECIEVE_USER redux action.
- Write a unit test for the RegistrationForm container.
    - We might want to pull out a vanilla React compnent from the container to
    make it more testable.
- Consider what we can test in express.

## What are the alternatives?
**Author:** danielbingham

*What are the alternative solutions we considered, but ultimately decided against?*

In a previous story we decided to go with Mocha, Chai, and Sinon over Jasmine.

## What are we not doing?
**Author:** danielbingham

*Is there anything we explicitly decided not to pursue as part of this story?  Why?*

We're not writing e2e tests or setting up an e2e test harness.  That can come
later.  We're also not going to worry about integration tests for now.

## What tests do we need?
**Author:** danielbingham

*Outline what unit, integration, and e2e tests we plan to write for this story.*

- A test around RECIEVE_USER
- A test around RegistrationForm
