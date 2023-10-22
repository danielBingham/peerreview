# Journal Creation Tests

## Motiviation 

Confirm the journal creation flow is working as it should.

## Test Plan

- [x] From the home page, click on `New Journal`.
    - [x] **Confirm** it takes you to `/create`
- [x] From the `Submission` menu, select `New Journal`
    - [x] Enter a name and description
    - [x] Add a member and change their permissions to `editor`
    - [x] Add a member and change their permissions to `reviewer`
    - [x] Select a `model`
    - [x] Click `create`
    - [x] Confirm journal created
    - [x] Confrm members shown on the `Members` tab with appropriate permissions
    -
## Run

For 0.3.5 with params:`{ journal: { name:'Test Open-Public', model: 'open-public'}}`
