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

| Permission                        | Required Fields           | Description                   |
|-----------------------------------|---------------------------|-------------------------------|
| `Paper:entity:view`               | `paper_id`                | Grants the `view` action on `Paper`.  |
| `Paper:entity:identify`           | `paper_id`                | Grants the ability to `identify` the anonymous authors of `Paper`. |
| `Paper:entity:edit`               | `paper_id`                | Grants the ability to `edit` the title, fields, or authors of `Paper` as well as upload new version and submit preprints or submissions.    |
| `Paper:entity:review`             | `paper_id`                | Grants the ability to `review` the `Paper`. |
| `Paper:entity:comment`            | `paper_id`                | Grants the ability to `comment` on `Paper`. |


