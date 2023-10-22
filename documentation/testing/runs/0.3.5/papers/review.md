# Paper Review 

## Motivation

Confirm that the paper review flows are working as expected.

## Pre-requisites

- Log in as a user who has permission to see and review {{paper.title}}

## Test Plan 

- [x] Start a new review on {{paper.title}}
    - [x] **Confirm** review form shows on the File tab
    - [x] **Confirm** review form shows on the Timeline tab
    - On the File Tab
        - [x] Click on the file to add a new comment.
            - [x] **Confirm** the pin appears where you clicked.
            - [x] **Confirm** the comment form appears lined up with the pin.
            - [x] **Confirm** the comment thread is selected and highlighted.
            - [x] Write some text in the comment box and click `Add Comment`
                - [x] **Confirm** the comment appears as posted.
                - [x] **Confirm** the time after 'posted' is correct.
                - [x] **Confirm** the dots menu is present.
        - [x] Click 'Post a reply...' to add a reply to an existing comment thread
            - [x] **Confirm** the comment thread is selected, highlighted, and centered on its pin.
            - [x] **Confirm** the comment form appears at the end of the thread.
            - [x] Write some text in the comment box and click `Add Comment`
                - [x] **Confirm** the reply appears attached to the thread.
                - [x] **Confirm** the dots menu is present.
        - [x] Click on the file close to the pin from the first comment to create a new comment. 
            - [x] **Confirm** a pin appears on the file where clicked.
            - [x] **Confirm** the new comment thread appears selected and aligned with the pin.
            - [x] **Confirm** the first comment moves out of the way to allow the new comment to align.
        - [x] Select 'Edit' from the dots menu to edit a comment.
            - [x] **Confirm** the comment form shows populated with the comments content.
            - [x] Add some content and click 'Edit Comment' to save the edit.
                - [x] **Confirm** Comment shows with the editted content.
        - [x] Select 'Edit' from the dots menu to edit a comment.
            - [x] Add some content and click 'Cancel' to cancel the edit.
                - [x] **Confirm** Comment shows as committed with the previous content.
        - [x] Select 'Delete' from the dots menu to delete a comment.
            - [x] **Confirm** comment disappears appropriately.
            - [x] **Confirm** comments reorder and position to account for the new space.
        - [x] Click on the file to add a new comment.
            - [x] **Confirm** comment appears appropriately and there are no errors in console.
    - Click on the 'Timeline' tab to move to the Timeline view.
                - [x] **Confirm** the comment in progress appears on appropriately under the review in progress
                - [x] Add some content to the comment in progress and click 'Add Comment' to save the comment.
                - [x] Click 'Edit' from the dots menu to edit a comment.
                    - [x] Add some content.
                    - [x] Click 'Edit comment' to save the edit.
                    - [x] **Confirm** new content is saved.
                - [x] Click 'Edit' from the dots menu to edit a comment.
                    - [x] Add some content.
                    - [x] Click 'Cancel' to cancel the edit.
                    - [x] **Confirm** the comment shows the previous content.
    - Click on the File Tab to navigate to the File view
        - [x] Add some content to the review summary.
        - [x] Click on the file to add a new comment.
            - [x] Add some content to the comment but leave it in progress. (Don't click 'add comment' or 'cancel')
        - Refresh the page.
            - [x] **Confirm** the content in the summary is preserved.
            - [x] **Confirm** the content in the comment in progress is preserved.
        - Close the tab, then open a new tab and navigate to the paper's File Tab.
            - [x] **Confirm** the content in the summary is preserved.
            - [x] **Confirm** the content in the comment is preserved. 
        - [ ] Submit the review.
            - [x] **Confirm** the review is visible on the Timeline Tab
            - [x] **Confirm** the review is selectable from the review menu on the File tab.
                - [x] **Confirm** the review summary is shown when selected.
                - [x] **Confirm** the reviews comments are the only comments shown when selected.
               
## Run

Run for `0.3.5` with `{ paper: { title: 'Test preprint' }}`
