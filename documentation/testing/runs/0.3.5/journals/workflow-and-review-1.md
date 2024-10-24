# Journal Workflow and Review

## Motivation

Confirm journal editorial and review workflows are working as expected.

## Test Plan 

- For journal "{{journal.name}}"
    - Log in to a user with `managing-editor` permissions 
        - [x] Assign an `editor` to a submission.
    - Log in as the `editor` you just assigned.
        - [x] **Confirm** The assigned submission shows up on the "Editor Dashboard".
        - [x] **Confirm** The assigned submission is visible on the "Journal Submission List".
        - [x] Assign 3 reviewers to the submission, including the `editor`.
        - [x] Set submission status to `Review`
        - [x] Run [Paper Review](./paper-review.md) 
        - [x] **Confirm** the review has permissions appropriate to {{journal.model}}
        - [x] Change the visibility on the completed review to add `authors`.
    - Log in as an author 
        - [x] **Confirm** review is visible.
    - Log in as an `assigned-reviewer`
        - [x] Run [Paper Review](./paper-review.md)
    - Log in as `assigned-editor` 
        - [x] **Confirm** both reviews are visible on the timeline.
        - [x] **Confirm** both reviews are visible on the submission status page.
        - [x] Change the status to `Proofing`
        - [x] Change the status to `Published`
    - Log out
        - [x] **Confirm** the paper is visible in the published paper list of the journal
        - [x] **Confirm** the paper is visible in the published paper list of the home page
        - [x] **Confirm** the publish action shows on the timeline
        - [x] **Confirm** all events have visibility appropriate to the journal
## Run

Run for `0.3.5` with params:`{ journal: { name:'Test Closed', model: 'closed'}}`
