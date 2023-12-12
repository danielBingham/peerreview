# More Flexible Permissions

Acceptance Criteria:
- Minimal, fast queries for determining permissions.
- Configurable, but we can initialize to sane defaults.
- Minimize the programmatic or hidden permissions, the permission system should fully control access.
- Should be intuitive and work the way most people expect it to.
- When users change roles, the change should be retroactive. (???)

We need a more flexible permissions system that we can still configure based on
our three models, but that can then be customized by editors.  We also need a
system that we can query more efficiently.

We should use a system based on `permissions`, `roles`, and `groups`.

We can create a list of permissions based on an `object:permission` pattern,
where `object` can be a single thing (paper, review, etc) or a group of things
(JournalSubmissions, etc).

Proposed permission list:

- Paper:entity:view -- You can view a paper.
- Paper:entity:identify  -- You can see through anonimity protection for a paper's authors.
- Paper:entity:edit -- You can edit a paper's title, authors, taxonomy, upload new versions, and delete.  You can submit preprints and journal submissions.
- Paper:entity:review -- You can review a paper.
- Paper:entity:comment -- You can comment on a paper timeline.
- Paper:version:view -- You can view a version of a paper. Must also have `Paper:view`
- Paper:version:edit -- You can edit a version of a paper. Not used?
- Paper:version:review -- You can review a version of a paper. Must also have `Paper:edit`
- Paper:version:comment -- Not used?  Or controls the ability to comment on a particular version?
- Paper:review:view -- You can view a review of a paper. Must also have `Paper:view` and `PaperVersion:view`.
- Paper:review:identify -- You can view the identity of an anonymous reviewer.  Must also have `Paper:view`, `Review:view`, and `PaperVersion:view`
- Paper:review:edit -- You can edit or delete a review.  Must also have `Paper:view` and `PaperVersion:view`
- Paper:review:comment -- You can comment on a review.  Must also have `Paper:view` and `PaperVersion:view` and `Review:view`
- Paper:comment:view -- You can view a comment on a paper.  Must also have `Paper:view`
- Paper:comment:edit -- You can edit or delete a comment on a paper timeline.  Must also have `Paper:view`
- Paper:submission:view -- You can view a single submission associated with a paper.  Must also have `Paper:view`
- Paper:submission:edit -- You can edit a single submission associated with a paper.  Must also have `Paper:view`
- Journal:entity:view -- Not used? 
- Journal:entity:edit
- Journal:submissions:view -- You can view *all* submissions associated with a particular journal.
- Journal:submissions:edit -- You can edit *all* submissions associated with a particular journal.
- Journal:submissions:identify -- You can identify anonymous for *all* submissions associated with a particular journal.
- Journal:membership:view
- Journal:membership:edit
- Journal:settings:view
- Journal:settings:edit
- Journal:assignedSubmission:view -- You can view submissions you've been assigned to.
- Journal:assignedSubmission:edit -- You can edit submissions you've been assigned to.
- Journal:assignedSubmission:identify -- You can idenity anonymous actors for journal submissions you've been assigned to.


```
CREATE TYPE permission_type AS ENUM(...);

CREATE TABLE `user_permissions` (
    user_id bigint  REFERENCES users(id),
    permission permission_type,

    paper_id bigint REFERENCES papers(id) DEFAULT null,
    version int DEFAULT null,
    review_id bigint REFERENCES reviews(id) DEFAULT null,
    paper_comment_id    bigint REFERENCES paper_comments(id) DEFAULT NULL,
    submission_id   bigint REFERENCES journal_submissions(id) DEFAULT NULL,
    journal_id  bigint REFERENCES journals(id) DEFAULT NULL
);

CREATE TABLE `roles` (
    id  bigserial PRIMARY KEY,
    name    varchar(1024),
    description text,
    journal_id  bigint REFERENCES journals(id) DEFAULT NULL,
    paper_id    bigint REFERENCES papers(id) DEFAULT NULL
);
CREATE TABLE `user_roles` (
    role_id bigint REFERENCS roles(id) DEFAULT NULL,
    user_id bigint REFERENCES users(id) DEFAULT NULL
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

Initial roles are created based on model.

```
/** For a paper. ***/
INSERT INTO roles (name, description, paper_id)
    VALUES ('Coresponding Authors', 'Corresponding Authors on the paper.', id),
        ('Author', 'An non-corresponding author on the paper.', id);

INSERT INTO role_permissions (role_id, permission, paper_id)
    VALUES (<corresponding-authors-id>, 'Paper:entity:view', id),
        (<corresponding-authors-id>, 'Paper:entity:identify', id),
        (<corresponding-authors-id>, 'Paper:entity:edit', id),
        (<corresponding-authors-id>, 'Paper:entity:review', id),
        (<corresponding-authors-id>, 'Paper:entity:comment', id),
        ...
        (<author-id>, 'Paper:entity:view', id),
        (<author-id>, 'Paper:entity:review', id),




/** For the closed model. ***/
INSERT INTO roles (name, description, journal_id) 
    VALUES ('Editor in Chief', 'The chief editor of the journal, acts as the admin.', id),
            ('Managing Editor', 'An editor with permission to edit all submissions to the journal.', id),
            ('Editor', 'An editor with permission to edit the submission they are assigned to.', id),
            ('Reviewer', 'A journal member with permission to review the submissions they are assigned to.', id);
    RETURNING id, name

INSERT INTO role_permissions (role_id, permission, journal_id)
    VALUES (<editor-in-chief-id>, 'Journal:entity:edit', id),
            (<editor-in-chief-id>, 'Journal:entity:view', id),
            (<editor-in-chief-id>, 'Journal:submissions:view', id),
            (<editor-in-chief-id>, 'Journal:submissions:edit', id),
            (<editor-in-chief-id>, 'Journal:submissions:identify', id),
            (<editor-in-chief-id>, 'Journal:submissions:review', id),
            (<editor-in-chief-id>, 'Journal:submissions:comment', id),
            (<editor-in-chief-id>, 'Journal:membership:view', id),
            (<editor-in-chief-id>, 'Journal:membership:edit', id),
            (<editor-in-chief-id>, 'Journal:settings:view', id),
            (<editor-in-chief-id>, 'Journal:settings:edit', id),

            (<managing-editor-id>, 'Journal:entity:edit', id),
            (<managing-editor-id>, 'Journal:entity:view', id),
            (<managing-editor-id>, 'Journal:submissions:view', id),
            (<managing-editor-id>, 'Journal:submissions:edit', id),
            (<managing-editor-id>, 'Journal:submissions:identify', id),
            (<managing-editor-id>, 'Journal:submissions:review', id),
            (<managing-editor-id>, 'Journal:submissions:comment', id),

            (<editor-id>, 'Journal:entity:view', id),
            (<editor-id>, 'Journal:assignedSubmissions:view', id),
            (<editor-id>, 'Journal:assignedSubmissions:edit', id),
            (<editor-id>, 'Journal:assignedSubmissions:identify', id),
            (<editor-id>, 'Journal:assignedSubmissions:review', id),
            (<editor-id>, 'Journal:assignedSubmissions:comment', id),

            (<reviewer-id>, 'Journal:entity:view', id),
            (<reviewer-id>, 'Journal:assignedSubmissions:view', id),
            (<reviewer-id>, 'Journal:assignedSubmissions:review', id),
            (<reviewer-id>, 'Journal:assignedSubmissions:comment, id);
```

Determine if a user can view a paper:
```
SELECT permission FROM user_permissions
    WHERE user_id = userId AND paper_id = paperId AND permission = 'Paper:entity:view'
```

Determine if a user can view a paper's version:
```
SELECT permission FROM user_permissions
    WHERE user_id = userId AND paper_id = paperId AND permission = 'Paper:version:view'
```

Create a new paper submission -- This works if we don't have to make things retroactive.  If we do, then we need to run a job to go back through all the old materials and re-run the logic.
```
    // Everyone with 'Journal:submissions:view' gets 'Paper:entity:view' and
    // 'Paper:version:view' on the submitted version.
    SELECT user_id, permission, journal_id FROM user_permissions
        WHERE permission = 'Journal:submissions:view' AND journal_id = journalId;

    INSERT INTO user_permissions (user_id, permission, paper_id)
        VALUES (userId, 'Paper:entity:view', paperId)

```

Visibility: 
    Roles:
        Public
        author
            Corresponding Author
            Author
        editor
            Editor in Chief
            Managing Editor
            Editor
            Assigned Editor
        reviewer
            Reviewer
            Assigned Reviewer
    --- 
    Users:
        John Doe
        Jane Doe
        James Watson
        Francis Crick



Set Default Visibility:

**Review**
Visibility:
    Roles:
        Public
        editor
            *Editor in Chief
            *Managing Editor
            Editor
            *Assigned Editor
        reviewer
            Reviewer
            Assigned Reviewer
    --- 
    Users:
        John Doe
        Jane Doe
        James Watson
        Francis Crick

**Comment**
Visibility:
    Roles:
        Public
        editor
            *Editor in Chief
            *Managing Editor
            Editor
            *Assigned Editor
        reviewer
            Reviewer
            Assigned Reviewer
    --- 
    Users:
        John Doe
        Jane Doe
        James Watson
        Francis Crick

**Editor Assignment**
Visibility:
    Roles:
        Public
        editor
            *Editor in Chief
            *Managing Editor
            Editor
            *Assigned Editor
        reviewer
            Reviewer
            Assigned Reviewer
    --- 
    Users:
        John Doe
        Jane Doe
        James Watson
        Francis Crick


**Reviewer Assignment**
Visibility:
    Roles:
        Public
        editor
            *Editor in Chief
            *Managing Editor
            Editor
            *Assigned Editor
        reviewer
            Reviewer
            *Assigned Reviewer
    --- 
    Users:
        John Doe
        Jane Doe
        James Watson
        Francis Crick
