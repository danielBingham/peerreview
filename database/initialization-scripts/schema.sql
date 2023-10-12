/* Peer Review Schema file */

/* Allows us to do fuzzy finding. */
CREATE EXTENSION pg_trgm;

/*****************************************************************************
 * Feature Flags
 *****************************************************************************/

/** 
 * NOTE: When adding a new status, make sure to update it in
 * FeatureController::patchFeature() 
 */
CREATE TYPE feature_status AS ENUM(
    'created', /* the feature's row has been inserted into the databse table */
    'initializing',
    'initialized', /* the feature has been initialized */
    'migrating', /* the feature's data migration is being run */
    'migrated', /* the feature's data has been successfully migrated */
    'enabled',
    'disabled',
    'rolling-back', 
    'rolled-back', 
    'uninitializing',
    'uninitialized'
);
CREATE TABLE features (
    name varchar(256) PRIMARY KEY,
    status feature_status DEFAULT 'created',
    created_date timestamptz,
    updated_date timestamptz
);

/******************************************************************************
 * Users 
 *****************************************************************************/

CREATE TYPE user_status AS ENUM('invited', 'unconfirmed', 'confirmed');
CREATE TYPE user_permissions AS ENUM('user', 'moderator', 'admin', 'superadmin');
CREATE TABLE users (
    id bigserial PRIMARY KEY,
    blind_id uuid DEFAULT gen_random_uuid(), 
    orcid_id varchar(256),
    status user_status DEFAULT 'unconfirmed',
    permissions user_permissions DEFAULT 'user',
    name varchar(512),
    password varchar(256),
/*    file_id uuid REFERENCES files(id), Added below with an alter statement. */
    email varchar(512),
    bio text,
    location varchar(256),
    institution varchar(256),
    reputation int DEFAULT 0,
    created_date timestamptz,
    updated_date timestamptz 
);
CREATE INDEX users__orcid_id ON users (orcid_id);
CREATE INDEX users__blind_id ON users (blind_id);
CREATE INDEX users__name ON users (name);
CREATE INDEX users__name_trgm ON users USING GIN (name gin_trgm_ops);

/**
 * User notification types.
 * 
 * These take the form of:
 *  <notified-user-type>:<Object-type>:<event-type>
 */
CREATE TYPE user_notification_type AS ENUM(

    /* ============ Paper Notifications ======================================= */
    /* User was added to a paper as an author. */
    'author:paper:submitted', 
    
    /* 
     * A new version was uploaded for a paper the user is an author, editor, or
     * reviewer on. 
     */
    'author:paper:new-version', 
    'reviewer:paper:new-version',

    /**
     * A paper the user is an author of was submitted as a preprint.
     */
    'author:paper:preprint-posted',

    /**
     * A review was posted to a paper that the user is an author of.
     */
    'author:paper:new-review',

    /**
     * A reply was posted to a comment thread the user is participating in. TODO
     */
    'author:paper:review-comment-reply',
    'reviewer:paper:review-comment-reply',

    /**
     * A comment was posted to the timeline of a paper the user is an author,
     * reviewer, or editor for. TODO
     */
    'author:paper:new-comment',
    'reviewer:paper:new-comment',
   
    /* ============ Journal Notifications ===================================== */
    /**
     * User has been added to a journal's team.
     */
    'journal-member:journal:invited',

    /**
     * Role in journal changed. TODO
     */
    'journal-member:journal:role-changed',

    /**
     * User removed from journal's team. TODO
     */
    'journal-member:journal:removed',

    /* ============ Submission Notifications ================================== */
    

    /**
     * A paper the user is an author of was submitted to a journal.
     * A journal the user is a managing editor of received a new submission.
     */
    'author:submission:new', 
    'editor:submission:new',

    /* 
     * A new version was uploaded for a submission the user is an editor, or
     * reviewer on. 
     */
    'author:submission:new-version',
    'reviewer:submission:new-version',
    'editor:submission:new-version',

    /**
     * A new review was submitted for a submission the user is editing.
     */ 
    'author:submission:new-review',
    'editor:submission:new-review',

    /**
     * A reply was posted to a comment thread the user is participating in. TODO
     */
    'author:submission:review-comment-reply',
    'reviewer:submission:review-comment-reply',
    'editor:submission:review-comment-reply',

    /**
     * A new timeline comment on a paper the user is a reviewer or editor for.
     */
    'author:submission:new-comment',
    'reviewer:submission:new-comment',
    'editor:submission:new-comment',

    /**
     * The status of a submission the user is an author of changed.
     */
    'author:submission:status-changed',
    'editor:submission:status-changed',

    /**
     * A user was (un)assigned as a reviewer to a paper. 
     */
    'reviewer:submission:reviewer-assigned',
    'reviewer:submission:reviewer-unassigned',

    /**
     * A user was (un)assigned as an editor to a paper.
     */
    'editor:submission:editor-assigned',
    'editor:submission:editor-unassigned'
);
    
CREATE TABLE user_notifications (
    id bigserial PRIMARY KEY,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE NOT NULL ,
    type user_notification_type,
    description text,
    path varchar(1024),
    is_read boolean,
    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX user_notifications__user_id ON user_notifications (user_id);


/******************************************************************************
 * Tokens
 *****************************************************************************/

CREATE TYPE token_type AS ENUM('email-confirmation', 'reset-password', 'invitation');
CREATE TABLE tokens (
    id bigserial PRIMARY KEY,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    token varchar(1024),
    type token_type NOT NULL,
    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX tokens__token ON tokens (token);


/******************************************************************************
 * Files 
 *****************************************************************************/

CREATE TABLE files (
    id uuid PRIMARY KEY,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    location varchar(1024), /* This is the S3/Spaces bucket URL. */
    filepath varchar(1024),
    type varchar(256),
    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX files__user_id ON files (user_id);

/*  Now that we've created the files table, we can add the link to the users table. */
/* This is for the user's profile picture. */
ALTER TABLE users ADD COLUMN file_id uuid REFERENCES files(id) ON DELETE SET NULL;
CREATE INDEX users__file_id ON users (file_id);

/******************************************************************************
 * Fields 
 *****************************************************************************/

CREATE TABLE fields (
    id bigserial PRIMARY KEY,
    name varchar(512),
    description text,
    type varchar(512), /* Name of the top level parent, used as a class to give the tag its color. */
    depth int, /* The depth in the heirarchy.  When there are multiple paths the highest depth will be used. */
    average_reputation int, /* The average reputation given per paper in this field.  Initially average citations * 10. */
    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX fields__name ON fields (name);
CREATE INDEX fields__name_trgm ON fields USING GIN (name gin_trgm_ops);

CREATE TABLE field_relationships (
    parent_id bigint REFERENCES fields(id) ON DELETE CASCADE,
    child_id bigint REFERENCES fields(id) ON DELETE CASCADE,
    PRIMARY KEY (parent_id, child_id)
);

/******************************************************************************
 * User Settings 
 *****************************************************************************/

CREATE TABLE user_settings (
    id bigserial PRIMARY KEY,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    welcome_dismissed boolean,
    wip_dismissed boolean DEFAULT false,
    funding_dismissed boolean,
    created_date timestamptz,
    updated_date timestamptz
);

CREATE TYPE user_field_setting AS ENUM('ignored', 'isolated');
CREATE TABLE user_field_settings (
    setting_id bigint REFERENCES user_settings(id) ON DELETE CASCADE,
    field_id bigint REFERENCES fields(id) ON DELETE CASCADE,
    setting user_field_setting,
    PRIMARY KEY (setting_id, field_id)
);


/******************************************************************************
 * Papers
 *****************************************************************************/

CREATE TABLE papers (
    id  bigserial PRIMARY KEY,
    title   varchar(1024) NOT NULL,
    searchable_title tsvector GENERATED ALWAYS AS (to_tsvector('english', title)) STORED,
    show_preprint boolean DEFAULT false,
    is_draft   boolean DEFAULT true,
    score   int NOT NULL DEFAULT 0,
    created_date    timestamptz,
    updated_date    timestamptz
);
CREATE INDEX papers__title_search_index ON papers USING GIN (searchable_title);

CREATE TABLE paper_versions (
    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE,
    version int NOT NULL,
    file_id uuid REFERENCES files(id) ON DELETE CASCADE,
    is_published boolean DEFAULT false,
    review_count int default 0,
    content text NOT NULL,
    searchable_content tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
    created_date timestamptz,
    updated_date timestamptz,
    PRIMARY KEY (paper_id, version)
);
CREATE INDEX paper_versions__search_index ON paper_versions USING GIN (searchable_content);
CREATE INDEX paper_versions__file_id_index ON paper_versions (file_id); 

CREATE TABLE paper_authors (
    paper_id    bigint REFERENCES papers(id) ON DELETE CASCADE,
    user_id     bigint REFERENCES users(id) ON DELETE CASCADE,
    author_order    int,
    owner           boolean,
    submitter       boolean,
    PRIMARY KEY (paper_id, user_id)
);

CREATE TABLE paper_fields (
    paper_id    bigint REFERENCES papers(id) ON DELETE CASCADE,
    field_id    bigint REFERENCES fields(id) ON DELETE CASCADE,
    PRIMARY KEY (paper_id, field_id)
);

CREATE TYPE paper_comments_status AS ENUM('in-progress', 'committed', 'edit-in-progress');
CREATE TABLE paper_comments (
    id          bigserial PRIMARY KEY,
    paper_id    bigint REFERENCES papers(id) ON DELETE CASCADE,
    user_id     bigint REFERENCES users(id) ON DELETE CASCADE,
    status      paper_comments_status,
    content     text,
    created_date    timestamptz,
    updated_date    timestamptz,
    committed_date  timestamptz DEFAULT NULL
);
CREATE INDEX paper_comments__paper_id ON paper_comments (paper_id);
CREATE INDEX paper_comments__user_id ON paper_comments (user_id);

CREATE TABLE paper_comment_versions (
    paper_comment_id    bigint REFERENCES paper_comments(id) ON DELETE CASCADE,
    version             int DEFAULT 1,
    content             text,
    created_date        timestamptz,
    updated_date        timestamptz
);
CREATE INDEX paper_comment_versions__paper_comment_id ON paper_comment_versions (paper_comment_id);
CREATE INDEX paper_comment_versions__version ON paper_comment_versions (version);

/******************************************************************************
 * Journals
 ******************************************************************************/

CREATE TYPE journal_model as ENUM('public', 'open-open', 'open-closed', 'closed');
CREATE TABLE journals (
    id      bigserial PRIMARY KEY,
    name    varchar(1024) NOT NULL,
    model journal_model NOT NULL DEFAULT 'closed', 
    description text,
    created_date    timestamptz,
    updated_date    timestamptz
);
CREATE INDEX journals__name_index ON journals (name);
CREATE INDEX journals_name_trgm_index ON journals USING GIN (name gin_trgm_ops);

CREATE TYPE journal_member_permissions AS ENUM('owner', 'editor', 'reviewer');
CREATE TABLE journal_members (
    journal_id  bigint REFERENCES journals(id) ON DELETE CASCADE,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    member_order int,
    permissions journal_user_permissions DEFAULT 'reviewer',
    created_date    timestamptz,
    updated_date    timestamptz,
    PRIMARY KEY (journal_id, user_id)
);

CREATE TYPE journal_submission_status AS ENUM('submitted', 'review', 'proofing', 'published', 'rejected', 'retracted')
CREATE TABLE journal_submissions (
    id bigserial PRIMARY KEY,
    journal_id bigint REFERENCES journals(id) ON DELETE CASCADE,
    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE,
    submitter_id bigint REFERENCES users(id),
    submission_comment text,
    status journal_submission_status,
    decider_id bigint REFERENCES users(id) DEFAULT null,
    decision_comment text,
    decision_date timestamptz,
    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX journal_submissions__journal_id_index ON journal_submissions ( journal_id );
CREATE INDEX journal_submissions__paper_id_index ON journal_submissions ( paper_id );

CREATE TABLE journal_submission_editors (
    submission_id bigint REFERENCES journal_submissions(id) ON DELETE CASCADE,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    created_date timestamptz,
    updated_date timestamptz,
    PRIMARY KEY (submission_id, user_id)
);

CREATE TABLE journal_submission_reviewers (
    submission_id bigint REFERENCES journal_submissions(id) ON DELETE CASCADE,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    created_date timestamptz,
    updated_date timestamptz,
    PRIMARY KEY (submission_id, user_id)
);

/******************************************************************************
 *  Reputation
 *****************************************************************************/

CREATE TABLE user_initial_field_reputation (
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    field_id bigint REFERENCES fields(id) ON DELETE CASCADE,
    reputation int,
    PRIMARY KEY (user_id, field_id)
);

CREATE TABLE user_initial_works_reputation (
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    works_id varchar(64),
    reputation int,
    PRIMARY KEY (user_id, works_id)
);

CREATE TABLE user_paper_reputation (
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE,
    reputation int,
    PRIMARY KEY (user_id, paper_id)
);

CREATE TABLE user_field_reputation (
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    field_id bigint REFERENCES fields(id) ON DELETE CASCADE,
    reputation int,
    PRIMARY KEY (user_id, field_id)
);

CREATE TABLE user_review_reputation (
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE,
    reputation int,
    PRIMARY KEY (user_id, paper_id)
);

/******************************************************************************
 * Reviews 
 *****************************************************************************/

CREATE TYPE review_status AS ENUM('in-progress', 'submitted', 'rejected', 'accepted');
CREATE TYPE review_recommendation as ENUM( 'reject', 'commentary', 'request-changes', 'approve');
CREATE TABLE reviews (
    id bigserial PRIMARY KEY,
    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE,
    submission_id bigint REFERENCES journal_submissions(id) DEFAULT null,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    version int,
    number int, /* Number of review on this paper version. 0 - n where n is the number of reviews on this paper specifically. */
    summary text,
    recommendation review_recommendation,
    status review_status,
    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX reviews__paper_id ON reviews (paper_id);
CREATE INDEX reviews__user_id ON reviews (user_id);
CREATE INDEX reviews__version ON reviews (version);

CREATE TABLE review_comment_threads (
    id bigserial PRIMARY KEY,
    review_id bigint REFERENCES reviews(id) ON DELETE CASCADE,
    page        int, 
    pin_x       numeric(20,20),
    pin_y       numeric(20,20) 
);
CREATE INDEX review_comment_threads__review_id ON review_comment_threads (review_id);

CREATE TYPE review_comment_status as ENUM('in-progress', 'posted', 'edit-in-progress', 'reverted');
CREATE TABLE review_comments (
    id          bigserial PRIMARY KEY,
    thread_id   bigint REFERENCES review_comment_threads(id) ON DELETE CASCADE, 
    user_id     bigint REFERENCES users(id) ON DELETE CASCADE,
    number      int, /* Which number comment on this review is this? */
    thread_order int,
    status review_comment_status,
    content     text,
    created_date    timestamptz,
    updated_date    timestamptz
);
CREATE INDEX review_comments__thread_id ON review_comments (thread_id);
CREATE INDEX review_comments__user_id ON review_comments (user_id);

CREATE TABLE review_comment_versions (
    comment_id      bigint REFERENCES review_comments(id) ON DELETE CASCADE,
    version         int NOT NULL DEFAULT 1,
    content         text,
    created_date    timestamptz,
    updated_date    timestamptz,
    PRIMARY KEY (comment_id, version)
);


/******************************************************************************
 * Paper Events
 * 
 * Paper events need to be created down here, because they have dependencies on
 * almost every other table.
 *
 ******************************************************************************/

CREATE TYPE paper_event_types AS ENUM(
    'paper:new-version', 
    'paper:preprint-posted',
    'paper:new-review', 
    'paper:comment-posted',
    'review:comment-reply-posted',
    'submission:new', 
    'submission:new-review',
    'submission:status-changed',
    'submission:reviewer-assigned',
    'submission:reviewer-unassigned',
    'submission:editor-assigned',
    'submission:editor-unassigned'
);

CREATE TYPE paper_event_visibility AS ENUM(
    'managing-editors',
    'editors',
    'assigned-editors',
    'reviewers',
    'assigned-reviewers',
    'corresponding-authors',
    'authors',
    'public'
);

CREATE TYPE paper_event_status AS ENUM(
    'in-progress',
    'committed'
);

/** 
 * Bottom section is sparsely populated links to other entities related to this
 * particular event.  Each event type will populate a subset of these. 
 */
CREATE TABLE paper_events (
    id bigserial PRIMARY KEY,
    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE NOT NULL,
    actor_id bigint REFERENCES users(id) NOT NULL,
    version int NOT NULL,
    status paper_event_status DEFAULT 'committed',
    type paper_event_types NOT NULL,
    visibility paper_event_visibility[] NOT NULL DEFAULT '{"authors"}',
    event_date timestamptz,

    assignee_id bigint REFERENCES users(id) DEFAULT NULL,
    review_id bigint REFERENCES reviews(id) DEFAULT NULL ON DELETE CASCADE,
    review_comment_id bigint REFERENCES review_comments(id) DEFAULT NULL,
    submission_id bigint REFERENCES journal_submissions(id) DEFAULT NULL,
    new_status journal_submission_status DEFAULT NULL,
    paper_comment_id bigint REFERENCES paper_comments(id) DEFAULT NULL ON DELETE CASCADE
);

/******************************************************************************
 * Responses 
 *****************************************************************************/

CREATE TYPE response_status AS ENUM('in-progress', 'posted');
CREATE TABLE responses (
    id  bigserial PRIMARY KEY,
    paper_id    bigint REFERENCES papers(id) ON DELETE CASCADE,
    user_id     bigint REFERENCES users(id) ON DELETE CASCADE,
    vote int DEFAULT 0,
    status  response_status,
    created_date    timestamptz,
    updated_date    timestamptz
);

CREATE TABLE response_versions (
    response_id bigint REFERENCES responses(id) ON DELETE CASCADE,
    version int NOT NULL,
    vote int DEFAULT 0,
    content text,
    created_date    timestamptz,
    updated_date    timestamptz,
    PRIMARY KEY(response_id, version)
);

