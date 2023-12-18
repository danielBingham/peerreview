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

| Permission                        | Required Fields                   | Description                   |
|-----------------------------------|-----------------------------------|-------------------------------|

| `Paper:entity:view`               | `paper_id`                        | Grants `view` on `Paper`. Allows the user or role to see that the paper exists.  |
| `Paper:entity:identify`           | `paper_id`                        | Grants the ability to `identify` the anonymous authors of `Paper`. |
| `Paper:entity:edit`               | `paper_id`                        | Grants `edit` on `Paper`. Allows the user or role to edit the title, fields, or authors of the paper as well as upload new version and submit preprints or submissions.    |
| `Paper:entity:review`             | `paper_id`                        | Grants `review` on `Paper`. Allows the user or role to review the paper. |
| `Paper:entity:comment`            | `paper_id`                        | Grants `comment` on `Paper`. Allows the user or role to comment on the paper. |

| `Paper:event:view`                | `paper_id`, `event_id`            | Grants `view` on the `event` attached to `Paper`. Allows the user or role to view the event. |
| `Paper:event:edit`                | `paper_id`, `event_id`            | Grants `edit` the `event` on `Paper` by changing its visibility. |
| `Paper:event:identify`            | `paper_id`, `event_id`            | Allows identification (`identify`) of the anonymous actor of `event` on `Paper`. |
| `Paper:events:view`               | `paper_id`                        | Grants `view` on all events attached to `Paper`. |


