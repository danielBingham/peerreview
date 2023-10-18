# Draft Review Tests

Test cover the review process.

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
