# Draft Submission Tests

## Motivation

Confirm the paper submission flow is working as expected.

## Test Plan

- [x] Click on 'New' -> 'Submission' 
    - [x] Confirm you're taking to `/submit`
- From the 'Home' page, click on 'New Submission'
    - [x] **Confirm** you are taken to `/submit`
    - [x] Give the paper the title 'Test Single Author Paper'
    - [x] Add a field, eg. `biology`
    - [x] **Confirm** Field suggestions is working appropriately
    - [x] **Confirm** Authors is populated with the current user with permissions set to 'Corresponding Author'
    - [x] Choose a PDF File
    - [x] Leave Preprint and Journal blank, submit the paper.
- Click on 'New' -> 'Submission
    - [x] Give the paper the title 'Test Multiple-Author Paper'
    - [x] Add a field, eg. `biology`
    - [x] Add two additional co-authors, with permissions set to "author"
    - [x] **Confirm** Author suggestion is working appropriately
    - [x] Choose a PDF file
    - [x] Leave Preprint and Journal blank, submit the paper.
- Click on 'New' -> 'Submission'
    - [x] Give the paper the title 'Test Multiple Fields Paper'
    - [x] Add several fields
    - [x] Add two authors
    - [x] Choose a PDF
    - [x] Leave Preprint and Journal blank, submit the paper.
- Click on 'New' -> 'Submission'
    - [x] Give the paper the title 'Test Preprint Paper'
    - [x] Add a field, eg. `biology`
    - [x] Add an author
    - [x] Choose a PDF
    - [x] Select "Preprint"
    - [x] Leave the journal blank and submit the paper
- Click on 'New' -> 'Submission'
    - [x] Give the paper the title 'Test Journal Submission Paper'
    - [x] Add a field
    - [x] Add an author
    - [x] Choose a PDF
    - [x] Leave "Preprint" blank
    - [x] Choose a journal to submit to
- Click on 'New' -> 'Submission'
    - [x] Give the paper the title 'Test Preprint and Journal Submission Paper'
    - [x] Add a field
    - [x] Add an author
    - [x] Choose a PDF
    - [x] select "Preprint"
    - [x] Chose a journal
    - [x] Submit the paper
- Click on 'New' -> 'Submission'
    - [x] Give the paper the title 'Test Deletion and Re-addition'
    - [x] Add a field, remove the field, add another field
    - [x] Add an author, remove an author, add another author
    - [x] Choose a PDF, delete the PDF, add another PDF
- Click on 'New' -> 'Submission'
    - [x] Give the paper the title 'Test Large file'
    - [x] Add a field
    - [x] Add an author
    - [x] Choose a large PDF file
    - [x] Leave Preprint and Journal blank, and submit the paper.

## Run

Run for 0.3.5
