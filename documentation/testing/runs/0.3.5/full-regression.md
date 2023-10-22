# Testing Peer Review

This document contains the steps necessary to run a manual test of Peer Review.
You can copy and paste the relevant sections into a PR to create a testing
checklist for that PR.

## Full Regression

- [ ] Authentication
- [ ] ORCID iD Authentication
- [ ] User Profile Edit
- [ ] Journal Creation
- [ ] Draft Submission 
- [ ] Journal Workflow and Review
- [ ] Draft Publish
- [ ] Paper Response
- [ ] Field List
- [ ] User List
- [ ] Published Paper List and View
- [ ] Paper Search

## Authentication

- [x] Register a new user with an email and password
    - [x] Complete email confirmation flow
    - [x] Logout from the new User's account
    - [x] Attempt to login to the new user's account with a bad password, confirm attempt fails.
    - [x] Login in to the new user's account with the email and password
    - [x] Reset the new user's password, logout and login with new password, confirm it works.

## ORCID iD Authentication

- [x] Register a new user with an ORCID iD
    - [x] Logout from the new user's account
    - [x] Login to the new user's account with an ORCID iD

- [x] Login to a user with email and password
    - [x] Connect ORCID iD to the account 

## User Profile Edit

- Login to a User
    - [x] Edit user's profile information
        - [x] Name
        - [x] Institution
        - [x] Location
        - [x] Biography
    - [x] Change user's email
    - [x] Change user's password 

## Journal Creation

- [x] Run [Journal Creation](./creation-1.md) with params:`{ journal: { name:'Test Closed', model: 'closed'}}` 
- [x] Run [Journal Creation](./creation-2.md) with params:`{ journal: { name:'Test Open', model: 'open'}}` 
- [x] Run [Journal Creation](./creation-3.md) with params:`{ journal: { name:'Test Open Public', model: 'open-public'}}` 
- [x] Run [Journal Creation](./creation-4.md) with params:`{ journal: { name:'Test Public', model: 'public'}}` 

## Draft Submission

- [x] Run [Draft Submission](./papers/submission.md)
- Login to a user with out permissions on `Test Closed`.
    - [x] Submit a draft to `Test Closed` with the title 'Paper for Test Closed'.
- Login to a user with out permissions on `Test Open`.
    - [x] Submit a draft to `Test Open` with the title 'Paper for Test Open'.
- Login to a user with out permissions on `Test Open-Public`.
    - [x] Submit a draft to `Test Open-Public` with the title 'Paper for Test Open-Public'.
- Login to a user with out permissions on `Test Public`.
    - [x] Submit a draft to `Test Public` with the title 'Paper for Test Public'.

## Preprint Review

- [x] Run [Paper Review](./paper-review.md) with params:`{ paper: { title: 'Test Preprint Paper' }}`

## Journal Workflow and Review

- [ ] Run [Journal Workflow and Review](./journal-workflow-and-review.md) with params:`{ journal: { name:'Test Closed', model: 'closed'}}`
- [ ] Run [Journal Workflow and Review](./journal-workflow-and-review.md) with params:`{ journal: { name:'Test Open', model: 'open'}}`
- [ ] Run [Journal Workflow and Review](./journal-workflow-and-review.md) with params:`{ journal: { name:'Test Open-Public', model: 'open-public'}}`
- [ ] Run [Journal Workflow and Review](./journal-workflow-and-review.md) with params:`{ journal: { name:'Test Public', model: 'public'}}`

## Paper Versioning

- [ ] Upload a new version of 'Test Preprint Paper'
- [ ] Run [Paper Review](./paper-review) on 'Test Preprint Paper'

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
