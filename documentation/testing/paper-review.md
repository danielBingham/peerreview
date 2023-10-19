# Paper Review 

## Motivation

Confirm that the paper review flows are working as expected.

## Pre-requisites

- Log in as a user who has permission to see and review {{submission.name}}

## Test Plan 

- [ ] Start a new review on {{submission.name}}
    - [ ] Confirm review form shows on the File tab
    - On the File Tab
        - [ ] Click on the file to add a new comment.
            - [ ] **Confirm** the pin appears where you clicked.
            - [ ] **Confirm** the comment form appears lined up with the pin.
            - [ ] **Confirm** the comment thread is selected and highlighted.
            - [ ] Write some text in the comment box and click `Add Comment`
                - [ ] **Confirm** the comment appears as posted.
                - [ ] **Confirm** the time after 'posted' is correct.
                - [ ] **Confirm** the dots menu is present.
        - [ ] Click 'Post a reply...' to add a reply to an existing comment thread
            - [ ] **Confirm** the comment thread is selected, highlighted, and centered on its pin.
            - [ ] **Confirm** the comment form appears at the end of the thread.
            - [ ] Write some text in the comment box and click `Add Comment`
                - [ ] **Confirm** the reply appears attached to the thread.
                - [ ] **Confirm** the dots menu is present.
        - [ ] Click on the file close to the pin from the first comment to create a new comment. 
            - [ ] **Confirm** a pin appears on the file where clicked.
            - [ ] **Confirm** the new comment thread appears selected and aligned with the pin.
            - [ ] **Confirm** the first comment moves out of the way to allow the new comment to align.
        - [ ] Select 'Edit' from the dots menu to edit a comment.
            - [ ] **Confirm** the comment form shows populated with the comments content.
            - [ ] Add some content and click 'Edit Comment' to save the edit.
                - [ ] **Confirm** Comment shows with the editted content.
        - [ ] Select 'Edit' from the dots menu to edit a comment.
            - [ ] Add some content and click 'Cancel' to cancel the edit.
                - [ ] **Confirm** Comment shows as committed with the previous content.
        - [ ] Select 'Delete' from the dots menu to delete a comment.
            - [ ] **Confirm** comment disappears appropriately.
            - [ ] **Confirm** comments reorder and position to account for the new space.
        - [ ] Click on the file to add a new comment.
            - [ ] **Confirm** comment appears appropriately and there are no errors in console.
    - Click on the 'Timeline' tab to move to the Timeline view.
                - [ ] **Confirm** the comment in progress appears on appropriately under the review in progress
                - [ ] Add some content to the comment in progress and click 'Add Comment' to save the comment.
                - [ ] Click 'Edit' from the dots menu to edit a comment.
                    - [ ] Add some content.
                    - [ ] Click 'Edit comment' to save the edit.
                    - [ ] **Confirm** new content is saved.
                - [ ] Click 'Edit' from the dots menu to edit a comment.
                    - [ ] Add some content.
                    - [ ] Click 'Cancel' to cancel the edit.
                    - [ ] **Confirm** the comment shows the previous content.
    - Click on the File Tab to navigate to the File view
        - [ ] Add some content to the review summary.
        - [ ] Click on the file to add a new comment.
            - [ ] Add some content to the comment but leave it in progress. (Don't click 'add comment' or 'cancel')
        - Refresh the page.
            - [ ] **Confirm** the content in the summary is preserved.
            - [ ] **Confirm** the content in the comment in progress is preserved.
        - Close the tab, then open a new tab and navigate to the paper's File Tab.
            - [ ] **Confirm** the content in the summary is preserved.
            - [ ] **Confirm** the content in the comment is preserved. 
        - [ ] Submit the review.
            - [ ] **Confirm** the review is visible on the Timeline Tab
            - [ ] **Confirm** the review is selectable from the review menu on the File tab.
                - [ ] **Confirm** the review summary is shown when selected.
                - [ ] **Confirm** the reviews comments are the only comments shown when selected.
