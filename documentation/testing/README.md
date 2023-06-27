# Testing Peer Review

This document contains the step necessary to run a manual test of Peer Review.
You can copy and paste the relevant sections into a PR to create a testing
checklist for that PR.

## Full Regression

- [ ] Authentication
- [ ] ORCID iD Authentication
- [ ] Reputation Generation
- [ ] User Profile Edit
- [ ] Draft Submission 
- [ ] Draft Paper List and View
- [ ] Draft Review
- [ ] Draft Version Upload
- [ ] Draft Version Review
- [ ] Draft Publish
- [ ] Paper Response
- [ ] Field List
- [ ] User List
- [ ] Published Paper List and View
- [ ] Paper Search

## Authentication

- [ ] Register a new user with an email and password
    - [ ] Complete email confirmation flow
    - [ ] Logout from the new User's account
    - [ ] Attempt to login to the new user's account with a bad password, confirm attempt fails.
    - [ ] Login in to the new user's account with the email and password
    - [ ] Reset the new user's password, logout and login with new password, confirm it works.

## ORCID iD Authentication

- [ ] Register a new user with an ORCID iD
    - [ ] Logout from the new user's account
    - [ ] Login to the new user's account with an ORCID iD

- [ ] Login to a user with email and password
    - [ ] Connect ORCID iD to the account 

## Reputation Generation

- [ ] Register a new user with email and password
    - [ ] Test reputation generation with an ORCID iD

## User Profile Edit

- Login to a User
    - [ ] Edit user's profile information
        - [ ] Name
        - [ ] Institution
        - [ ] Location
        - [ ] Biography
    - [ ] Change user's email
    - [ ] Change user's password 

## Draft Submission

- [ ] Submit a Draft Paper
    - [ ] With one author
    - [ ] With multiple authors
        - [ ] author suggestion is working correctly
    - [ ] With an author with commenter privileges
    - [ ] With one field
        - [ ] Field suggestion is working correctly
    - [ ] With multiple fields
    - [ ] Upload a file
        - [ ] Delete the uploaded file and upload a new one
    - [ ] with a very large file
    - [ ] With a file with lots of graphics

## Draft Review

- Logout of any users
    - [ ] Review list should require login
- Login to user with no reputation
    - [ ] Review list should be empty 
- Login to user with enough reputation to view fields populated with papers to review
    - [ ] Review list should display the papers user has Review reputation for
- While logged into a user with review reputation, select a paper to review from the list.
    - [ ] Confirm existing reviews show on the Review tab
        - [ ] Add a comment to a thread on the Review tab
    - [ ] Confirm comments match on the Drafts tab
        - [ ] Click on a comment, confirm it is centered
        - [ ] Click on a pin, confirm comment is highlighted, centered, and scrolled
        - [ ] Click on a comment or pin that causes a comment to be hidden near the top
        - [ ] Click on the "Click here to expand", confirm comments show again
    - [ ] Start a new review
        - [ ] Confirm review form shows on the Review tab
        - On the Draft Tab
            - [ ] Add a comment
            - [ ] Add a comment reply
            - [ ] Add another comment.
            - [ ] Edit a comment and save the edit
            - [ ] Edit a comment and cancel the edit
            - [ ] Delete a comment.
            - [ ] Begin a comment
        - On the Review Tab
            - [ ] Finish the started comment.
            - [ ] Edit a comment and save the edit.
            - [ ] Edit a comment and cancel the edit.
        - [ ] Populate the review summary and submit the review
- Login to a user who's an author on this draft with Owner permissions
    - [ ] Accept a review and confirm reputation gain for reviewer
    - [ ] Reject a review and confirm no reputation loss for reviewer

## Draft Version Upload

- Login as a user with owner permissions on a draft under review and navigate to that draft
    - [ ] Click "upload new version", select a file and upload it
        - [ ] Complete [Draft Review](draft-review) of the newly uploaded version

## Draft Publish

- Login as a user with owner permissions on a draft under review and navigate to that draft
    - [ ] Click "publish" and confirm draft shows up on the Papers List

## Paper Response

- Login as a user with Response permissions on a published paper
    - [ ] Write a response with 125 words and a vote, confirm score and reputation change appropriately.
        - [ ] Confirm each responder is only allowed one response.
    - [ ] Write a response with less than 125 words, confirm vote is denied.

## Field List

- Click into a field.
    - [ ] Confirm user's reputation, description, and reputation thresholds are shown on all tabs.
    - [ ] Confirm papers are listed on the papers tab.
    - [ ] select the parents tab, confirm appropriate parents are shown.
    - [ ] select the children tab, confirm children are shown and paged appropriately.

## User List

- [ ] Order user list by reputation and confirm it orders appropriately.
    - [ ] Click next page and confirm it pages appropriately.
- [ ] Order user list by newest, confirm it orders appopriately.
    - [ ] Click next page and confirm it pages appropriately.

## Published Paper List and View

- [ ] Order paper list by newest, confirm it orders appropriately.
- [ ] Order paper list by 'active', confirm it orders appropriately.

## Paper Search

- [ ] Search for a paper, confirm results are reasonable.
