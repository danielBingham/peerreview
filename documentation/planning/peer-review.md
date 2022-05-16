# Milestone Name

As a researcher I want to be able to post a draft of my paper and get peer
review feedback because it will help me refine my work so that it can have the
most significant impact possible.

## Background and Description
*On a high level, what do we want to achieve? Why are we doing it and what related things have we done before?*

One of the key features of the site will be replacing the manual peer review of
process of the journals with a crowd sourced one that doesn't require the
intervention of an editor. 

## Acceptance Criteria
*How will we know when the milestone has been achieved?  These should be verifiable, testable statements.*

## What do we need to do?
*Here's where you can brainstorm and document what we need to do to achieve this milestone and how we can go about doing it.*

We need to enable the user to post a draft of a paper, tag it with a set of
fields, add additional authors to it, and then request peer review.  We need a
screen where users can view drafts that they have the reputation to peer
review, so that they can offer their review.  We need to allow users to view
drafts with the existing peer reviews on them in some way, so that there can be
a conversation about the peer review comments.

### Peer Review Flow

For the author posting the draft, they will need to title it and add authors
and fields before posting.

1. Author uploads a PDF of a paper.
1. Author gives the PDF a title, adds additional authors by their emails/usernames, 
1. Author adds up to 5 fields to the draft. 
1. Author selects "Post Draft for Peer Review".  Draft goes live to users with
   enough reputation to offer Peer Review.

For the reviewer, they need to be able to see previous reviews, add comments to
them, and then post their own review.

1. Reviewer loads the paper under review.
1. Reviewer reads existing reviews and comments.
    1. Reviewer may add their voice to exiting reviews by commenting on the
       threads.
1. Reviewer can add their own review comments by highlighting on the PDF
   (similar to Google Docs).
1. Reviewer can add a summary to their review and then post it with two
   headings: Approved and Changes Requested.

Once the author has recieved a review, they can "Accept" or "Reject" it, based
on whether or not they found the comments helpful.  Accepting a review grants
reputation to the reviewer.  Rejecting it doesn't.

### Data Model

We'll need a table for the papers themselves:

```sql
CREATE TABLE papers (
    id BIGSERIAL PRIMARY KEY, 
    title VARCHAR(512), /* The paper's title, may need to be longer.  Will eventually need to be indexed. */
    path VARCHAR(512), /* The path to the paper's PDF in local storage or S3. */
    owner_id BIGINT, /* The user id of the posting author. */
    created_date TIMESTAMP,
    updated_date TIMESTAMP,

)
```

We'll also need a paper authors table:

```sql
CREATE TABLE paper_authors (
    paper_id BIGINT, /* The id of the paper. */
    user_id BIGINT /* The id of the user. */
)
```

We'll need a table for reviews:

```sql
CREATE TABLE paper_review (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT, /* The id of the user who authored this review. */
    paper_id BIGINT, /* The id of the paper this review is for, foreign key. */
    type VARCHAR(128), /* Approved or Changes Requested, could probably be enum. */
    status ENUM, /* Is this review pending?  Dismissed? Accepted? Rejected? */
    summary TEXT, /* The review's summary. */
    created_date TIMESTAMP,
    updated_date TIMESTAMP
)
```

And then we'll need a table for review comments:

```sql
CREATE TABLE paper_review_comment (
   id BIGSERIAL PRIMARY KEY,
   user_id BIGINT, /* The id of the user who authored this comment, often the same as the reviews author, but not always. */
   review_id BIGINT,
   content TEXT,
   created_date TIMESTAMP,
   updated_date TIMESTAMP
)
```

### Paper API

A fully populated `paper` object contains the paper and all of its authors as
populated user objects.

```
{
    id: int,
    title: string,
    path: string,
    owner: user,
    create_date: string(timestamp),
    updated_date: string(timestamp),
    authors: [
        user
    ]
}
```


#### `GET /papers`

Retrieve all papers with their authors.

**Request**: No body.

**Response**: All papers in the database, fully populated, along with their
authors as fully populated user objects.

**Errors**:

- Returns `500` and `unknown-error` on server error.

**Authorization**: Anyone.

#### `POST /papers`

#### `PUT /papers`

#### `PATCH /papers`

#### `DELETE /papers`

#### `GET /paper/:id`

#### `POST /paper/:id`

#### `PUT /paper/:id`

#### `PATCH /paper/:id`

#### `DELETE /paper/:id`

### Paper Upload API

#### `POST /paper/:id/upload`

Upload a pdf file to a paper destination.

**Implementation Notes**: We can use
[Multer](https://github.com/expressjs/multer) to handle the upload on the backend.

### Review API

A fully populated review object contains both the review's information and all
comments attached to that review.

```
{
    id: int


#### `GET /paper/:id/reviews`

#### `POST /paper/:id/reviews`

#### `PUT /paper/:id/reviews`

#### `PATCH /paper/:id/reviews`

#### `DELETE /paper/:id/reviews`

#### `GET /paper/:id/review/:id`



## How should we break up the work?
*Break the work up into small, clearly scoped, releasable stories.*
