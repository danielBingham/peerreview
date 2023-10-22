# Draft Submission Tests

## Motivation

Confirm the paper submission flow is working as expected.

## Test Plan

- [ ] Click on 'New' -> 'Submission' 
    - [ ] Confirm you're taking to `/submit`
- From the 'Home' page, click on 'New Submission'
    - [ ] **Confirm** you are taken to `/submit`
    - [ ] Give the paper the title 'Test Single Author Paper'
    - [ ] Add a field, eg. `biology`
    - [ ] **Confirm** Field suggestions is working appropriately
    - [ ] **Confirm** Authors is populated with the current user with permissions set to 'Corresponding Author'
    - [ ] Choose a PDF File
    - [ ] Leave Preprint and Journal blank, submit the paper.
- Click on 'New' -> 'Submission
    - [ ] Give the paper the title 'Test Multiple-Author Paper'
    - [ ] Add a field, eg. `biology`
    - [ ] Add two additional co-authors, with permissions set to "author"
    - [ ] **Confirm** Author suggestion is working appropriately
    - [ ] Choose a PDF file
    - [ ] Leave Preprint and Journal blank, submit the paper.
- Click on 'New' -> 'Submission'
    - [ ] Give the paper the title 'Test Multiple Fields Paper'
    - [ ] Add several fields
    - [ ] Add two authors
    - [ ] Choose a PDF
    - [ ] Leave Preprint and Journal blank, submit the paper.
- Click on 'New' -> 'Submission'
    - [ ] Give the paper the title 'Test Preprint Paper'
    - [ ] Add a field, eg. `biology`
    - [ ] Add an author
    - [ ] Choose a PDF
    - [ ] Select "Preprint"
    - [ ] Leave the journal blank and submit the paper
- Click on 'New' -> 'Submission'
    - [ ] Give the paper the title 'Test Deletion and Re-addition'
    - [ ] Add a field, remove the field, add another field
    - [ ] Add an author, remove an author, add another author
    - [ ] Choose a PDF, delete the PDF, add another PDF
- Click on 'New' -> 'Submission'
    - [ ] Give the paper the title 'Test Large file'
    - [ ] Add a field
    - [ ] Add an author
    - [ ] Choose a large PDF file
    - [ ] Leave Preprint and Journal blank, and submit the paper.

## Run

Run for x.x.x with params:``
