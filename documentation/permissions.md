# Permissions System

JournalHub uses a flexible permissions system in order to set a foundation for
future customization. Permissions can be assigned to users or roles (which can
in turn be assigned to users).

Permissions are defined in an `Object:[child-object(s)]+:action` form.

For example, `Paper:entity:view` grants the `view` action on the `Paper`, where
as `Paper:event:view` grants the `view` action on a single event on that Paper,
while `Paper:events:view` grants the `view` action on _all_ events on that
paper.

Permissions can be set on two tables: `user` and `role`.  Those tables have the
following structure:

```
CREATE TABLE `user_permissions` (
    user_id bigint  REFERENCES users(id),
    permission permission_type,

    paper_id bigint REFERENCES papers(id) DEFAULT null,
    version int DEFAULT null,
    event_id bigint REFERENCES paper_events(id) DEFAULT NULL,
    review_id bigint REFERENCES reviews(id) DEFAULT null,
    paper_comment_id    bigint REFERENCES paper_comments(id) DEFAULT NULL,
    submission_id   bigint REFERENCES journal_submissions(id) DEFAULT NULL,
    journal_id  bigint REFERENCES journals(id) DEFAULT NULL
);

CREATE TABLE `role_permissions` (
    role_id bigint REFERENCES roles(id) DEFAULT NULL,
    permission permission_type,

    paper_id bigint REFERENCES papers(id) DEFAULT null,
    version int DEFAULT null,
    event_id bigint REFERENCES paper_events(id) DEFAULT NULL,
    review_id bigint REFERENCES reviews(id) DEFAULT null,
    paper_comment_id    bigint REFERENCES paper_comments(id) DEFAULT NULL,
    submission_id   bigint REFERENCES journal_submissions(id) DEFAULT NULL,
    journal_id  bigint REFERENCES journals(id) DEFAULT NULL
);
```

Permissions that reference individual objects need to have the id set for each
object referenced.  For example, `Paper:version:view` needs to have both
`paper_id` and `version` set on its row.  While
`Journal:submissions:paper:view` oonly needs to have the `journal_id` set,
since it references the paper attached to each submission to the journal.

The following table defines all available permissions:

| Permission                        | Required Fields                   | Required Permissions          | Description                   |
|-----------------------------------|-----------------------------------|-------------------------------|-------------------------------|
| **Paper**                         |                                   |                               | Permissions on the root Paper.|
| `Paper:entity:view`               | `paper_id`                        |                               | Grants `view` on `Paper(paper_id)`. Allows the user or role to see that the paper exists.  |
| `Paper:entity:identify`           | `paper_id`                        | `Paper:entity:view`           | Grants `identify` on `Paper(paper_id)`. Allows the user or role identify anonymous authors of the paper. |
| `Paper:entity:edit`               | `paper_id`                        | `Paper:entity:view`           | Grants `edit` on `Paper(paper_id)`. Allows the user or role to edit the title, fields, or authors of the paper as well as upload new version and submit preprints or submissions.    |
| `Paper:entity:review`             | `paper_id`                        | `Paper:entity:view`           | Grants `review` on `Paper(paper_id)`. Allows the user or role to review the paper. |
| `Paper:entity:comment`            | `paper_id`                        | `Paper:entity:view`           | Grants `comment` on `Paper(paper_id)`. Allows the user or role to comment on the paper. |
|                                   |                                   |                               |                               |
| **Paper:version**                 |                                   |                               | Permissions on a single version attached to a paper. |
| `Paper:version:view`              | `paper_id`, `version`             | `Paper:entity:view`           | Grants `view` on `Version(version)` attached to `Paper(paper_id)`. Lets the user or role view the referenced version of the paper. |
| `Paper:version:edit`              | `paper_id`, `version`             | `Paper:entity:view`           | Grants `edit` on `Version(version)` attached to `Paper(paper_id)`.  Lets the user or role edit the referenced version, changing its visibility. |
| `Paper:version:review`            | `paper_id`, `version`             | `Paper:entity:view`           | Grants `review` on `Version(version)` attached to `Paper(paper_id)`.  Allows the user or role to review a single, referenced version of the referenced paper. |
| `Paper:version:comment`           | `paper_id`, `version`             | `Paper:entity:view`           | Grants `comment` on `Version(version)` attached to `Paper(paper_id)`.  Allows the user or role to comment on a single, referenced version of the referenced paper. |
|                                   |                                   |                               |                               |
| **Paper:versions**                |                                   |                               | Permissions on all versions attached to a paper. |
| `Paper:versions:view`             | `paper_id`                        | `Paper:entity:view`           | Grants `view` on all verisons attached to a `Paper`.  Allows the user or role to view all versions on a paper. |
| `Paper:versions:edit`             | `paper_id`                        | `Paper:entity:view`           | Grants `edit` on all versions attached to a `Paper`.  Allows the user or role to change the visibility of all versions on a paper. |
| `Paper:versions:review`           | `paper_id`                        | `Paper:entity:view`           | Grants `review` on all versions attached to a `Paper`. Allows the user or role to review all versions on a paper. | 
| `Paper:versions:comment`          | `paper_id`                        | `Paper:entity:view`           | Grants `comment` on all versions attached to a `Paper`. Allows the user or role to comment on all versions attached to a paper. |
|                                   |                                   |                               |                               |
| **Paper:version:events**          |                                   |                               | Permissions on all events attached to a version of a paper.|
| `Paper:version:events:view`       | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `view` on all events attached to `Version(version)` of `Paper(paper_id)`. Lets the user or role view all events on that version of the paper. |
| `Paper:version:events:edit`       | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `edit` on all events attached to `Version(version)` of `Paper(paper_id)`. Lets the user or role edit the visibility of all events on that version of the paper. |
| `Paper:version:events:identify`   | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `identify` on all events attached to `Version(version)` of `Paper(paper_id)`.  Lets the user or role identify the actor for all events on that version of the paper. |
|                                   |                                   |                               |                   |
| **Paper:event**                   |                                   |                               | Permissions on a single event on a paper. |
| `Paper:event:view`                | `paper_id`, `event_id`            | `Paper:entity:view`, `Paper:version:view` | Grants `view` on the `event` attached to `Paper`. Allows the user or role to view the event. | 
| `Paper:event:edit`                | `paper_id`, `event_id`            | `Paper:entity:view`, `Paper:version:view` | Grants `edit` the `event` on `Paper` by changing its visibility. |
| `Paper:event:identify`            | `paper_id`, `event_id`            | `Paper:entity:view`, `Paper:version:view` | Allows identification (`identify`) of the anonymous actor of `event` on `Paper`. |
|                                   |                                   |                               |                               |
| **Paper:events**                  |                                   |                               | Permissions on all events attached to a version of a paper.|
| `Paper:events:view`               | `paper_id`                        | `Paper:entity:view`, `Paper:version:view` | Grants `view` on all events attached to `Paper`. Lets the user or role view all events on the paper. |
| `Paper:events:edit`               | `paper_id`                        | `Paper:entity:view`, `Paper:version:view` | Grants `edit` on all events attached to a `Paper`. Lets the user or role edit all events on the paper. |
| `Paper:events:identify`           | `paper_id`                        | `Paper:entity:view`, `Paper:version:view` | Grants `identify` on all events attached to a `Paper`.  Lets the user or role identify the actor for all events on the paper. |
|                                   |                                   |                               |                               |
| **Paper:review**                  |                                   |                               | Grants permissions on a single review attached to a paper. |
| `Paper:review:view`               | `paper_id`, `version`, `review_id` | `Paper:entity:view`, `Paper:version:view` | Grants `view` on `Review(review_id)` of `Version(version)` attached to `Paper(paper_id)`.  Allows the user or role to view and read the review. |
| `Paper:review:identify`           | `paper_id`, `version`, `review_id` | `Paper:entity:view`, `Paper:version:view`, `Paper:review:view` | Grants `identify` on `Review(review_id)` of `Version(version)` attached to `Paper(paper_id)`. Allows the user or role to identify the anonymous reviewer of the review. |
| `Paper:review:edit`               | `paper_id`, `version`, `review_id` | `Paper:entity:view`, `Paper:version:view`, `Paper:review:view` | Grants `edit` on `Review(review_id)` of `Version(version)` attached to `Paper(paper_id)`.  Allows the user or role to edit the identified review. |
| `Paper:review:comment`            | `paper_id`, `version`, `review_id` | `Paper:entity:view`, `Paper:version:view`, `Paper:review:view` | Grants `comment` on `Review(review_id)` of `Version(version)` attached to `Paper(paper_id)`.  Allows the user or role to comment on the identified review. |
|                                   |                                   |                               |                              |
| **Paper:reviews**                 |                                   |                               | Grants permissions on all reviews attached to a version of a paper. |
| `Paper:reviews:view`              | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `view` on all Review objects of `Version(version)` attached to `Paper(paper_id)`.  Allows the user to view all reviews on that version. |
| `Paper:reviews:identify`          | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `identify` on all Review objects of `Version(version)` attached to `Paper(paper_id`.  Allows the user to identify anonymous reviewers of the reviews. |
| `Paper:reviews:edit`              | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `edit` on all Review objects of `Version(version)` attached to `Paper(paper_id)`.  Allows the user to edit all reviews attached to the version. |
| `Paper:reviews:comment`           | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `comment` on all Review objects of `Version(version)` attached to `Paper(paper_id)`. |
|                                   |                                   |                                           |                   |
| **Paper:comment**                 |                                   |                                           | Grants permissions on a single comment attached to a paper. | 
| `Paper:comment:view`              | `paper_id`, `version`, `comment_id` | `Paper:entity:view`, `Paper:version:view` | Grants `view` on `Comment(comment_id)` on `Version(version)` attached to `Paper(paper_id)`.  Allows the user to view the identified comment. |
| `Paper:comment:edit`              | `paper_id`, `version`, `comment_id` | `Paper:entity:view`, `Paper:version:view` | Grants `edit` on `Comment(comment_id)` on `Version(version)` attached to `Paper(paper_id)`.  Allows the user to edit the identified comment. |
| `Paper:comment:identify`          | `paper_id`, `version`, `comment_id` | `Paper:entity:view`, `Paper:version:view` | Grants `identify` on `Comment(comment_id)` on `Version(version)` attached to `Paper(paper_id)`.  Allows the user to identify the anonymous author of the identified comment. |
|                                   |                                   |                                           |                   |
| **Paper:comments**                |                                   |                                           | Grants permissions on a all comments attached to a version of a paper. | 
| `Paper:comments:view`             | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `view` on all comments attached to `Version(version)` of `Paper(paper_id)`. Allows the user to view all comments attached to the identified verison of the paper. | 
| `Paper:comments:edit`             | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `edit` on all comments attached to `Version(version)` of `Paper(paper_id)`. Allows the user to edit all comments attached to the identified verison of the paper. |
| `Paper:comments:identified`       | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `identified` on all comments attached to `Version(version)` of `Paper(paper_id)`.  Allows the user to identify the anonymous authors of all comments attached to the identified version of the paper. |
|                                   |                                   |                                           |                   |
| **Paper:submission**              |                                   |                                           | Grants permissions on the paper side of a submission to a journal. |
| `Paper:submission:view`           | `paper_id`, `version`, `submission_id` | `Paper:entity:view`, `Paper:version:view` | Grants `view` on `Submission(submission_id)` for `Version(version)` of `Paper(paper_id)`.  Allows the user to view the submission. |
| `Paper:submission:edit`           | `paper_id`, `version`, `submission_id` | `Paper:entity:view`, `Paper:version:view` | Grants `edit` on `Submission(submission_id)` for `Version(version)` of `Paper(paper_id)`.  Allows the user to edit the submission. |
|                                   |                                   |                                           |                   |
| **Paper:submissions**             |                                   |                                           | Grants permissions on the paper side of all submissions to a journal. |
| `Paper:submissions:view`          | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `view` on all submissions for `Version(version)` of `Paper(paper_id)`.  Allows the user to view all submissions to a journal on the identified version of paper. |
| `Paper:submissions:edit`          | `paper_id`, `version`             | `Paper:entity:view`, `Paper:version:view` | Grants `edit` on all submissions for `Version(version)` of `Paper(paper_id)`.  Allows the user to edit all submissions to a journal on the identified version of paper, changing their visibility or withdrawing them. |
|                                   |                                   |                                           |                   |
| **Journal**                       |                                   |                                           | Grants permissions on a single Journal. |
| `Journal:entity:view`             | `journal_id`                      |                                           | Grants `view` on `Journal(journal_id)`. Allows the user to view the journal. |
| `Journal:entity:edit`             | `journal_id`                      |                                           | Grants `edit` on `Journal(journal_id)`.  Allows the user to edit the journal's description, title, and about page. |
|                                   |                                   |                                           |                   |
| **Journal:member**                |                                   |                                           | Grants permissions to edit the membership of a single member of Journal. | 
| `Journal:member:view`             | `journal_id`, `user_id`           | `Journal:entity:view`                     | Grants `view` on the membership of `User(user_id)` in `Journal(journal_id)`.  Allows the user to see that `User(user_id)` is a member of `Journal(journal_id)`. |
| `Journal:member:edit`             | `journal_id`, `user_id`           | `Journal:entity:view`                     | Grants `edit` on the membership of `User(user_id)` in `Journal(journal_id)`. Allows the user to modify the membership of `User(user_id)` in `Journal(journal_id)`. |
|                                   |                                   |                                           |                   |
| **Journal:membership**            |                                   |                                           | Grants permissions on the memberships of all members of a Journal. |
| `Journal:membership:view`         | `journal_id`                      | `Journal:entity:view`                     | Grants `view` permission on the membership of all members of `Journal(journal_id)`.  Allows the user to view the membership information of all members of the journal. |
| `Journal:membership:edit`         | `journal_id`                      | `Journal:entity:view`                     | Grants `edit` permission on the membership of all members of `Journal(journal_id)`.  Allows the user to edit the membership information all members of the journal. |
|                                   |                                   |                                           |                   |
| **Journal:settings**              |                                   |                                           | Grants permissions on the journal's settings. |
| `Journal:settings:view`           | `journal_id`                      | `Journal:entity:view`                     | Grants `view` on the journal's settings. Allows the user to see the journal's settings. |
| `Journal:settings:edit`           | `journal_id`                      | `Journal:entity:view`                     | Grants `edit` on the journal's settings.  Allows the user to change the journal's settings. |


