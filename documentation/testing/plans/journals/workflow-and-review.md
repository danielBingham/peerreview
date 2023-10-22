# Journal Workflow and Review

## Motivation

Confirm journal editorial and review workflows are working as expected.

## Test Plan 

- For journal "{{journal.name}}"
    - Log in to a user with `managing-editor` permissions 
        - [ ] Assign an `editor` to a submission.
    - Log in as the `editor` you just assigned.
        - [ ] **Confirm** The assigned submission shows up on the "Editor Dashboard".
        - [ ] **Confirm** The assigned submission is visible on the "Journal Submission List".
        - [ ] Assign 3 reviewers to the submission, including the `editor`.
        - [ ] Set submission status to `Review`
        - [ ] Run [Paper Review](./paper-review.md) 
        - [ ] **Confirm** the review has permissions appropriate to {{journal.model}}
        - [ ] Change the visibility on the completed review to add `authors`.
    - Log in as an author 
        - [ ] **Confirm** review is visible.
    - Log in as an `assigned-reviewer`
        - [ ] Run [Paper Review](./paper-review.md)
    - Log in as `assigned-editor` 
        - [ ] **Confirm** both reviews are visible on the timeline.
        - [ ] **Confirm** both reviews are visible on the submission status page.
        - [ ] Change the status to `Proofing`
        - [ ] Change the status to `Published`
    - Log out
        - [ ] **Confirm** the paper is visible in the published paper list of the journal
        - [ ] **Confirm** the paper is visible in the published paper list of the home page
        - [ ] **Confirm** the publish action shows on the timeline
        - [ ] **Confirm** all events have visibility appropriate to the journal
