/* Peer Review Schema file */

/******************************************************************************
 * Users 
 *****************************************************************************/

CREATE TABLE users (
    id bigserial PRIMARY KEY,
    blind_id uuid DEFAULT gen_random_uuid(), 
    name varchar(256),
    password varchar(256),
    email varchar(256),
    bio text,
    location varchar(256),
    institution varchar(256),
    initial_reputation int DEFAULT 100,
    reputation int DEFAULT 100,
    created_date timestamptz,
    updated_date timestamptz 
);

/******************************************************************************
 * Files 
 *****************************************************************************/

CREATE TABLE files (
    id uuid PRIMARY KEY,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    location varchar(1024),
    filepath varchar(1024),
    type varchar(256),
    created_date timestamptz,
    updated_date timestamptz
);
CREATE INDEX files__user_id ON files (user_id);

/******************************************************************************
 * Fields 
 *****************************************************************************/

CREATE TABLE fields (
    id bigserial PRIMARY KEY,
    name varchar(512),
    description text,
    type varchar(512), /* Name of the top level parent, used as a class to give the tag its color. */
    created_date timestamptz,
    updated_date timestamptz
);

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
    title   varchar(1024),
    is_draft   boolean,
    created_date    timestamptz,
    updated_date    timestamptz
);

CREATE TABLE paper_versions (
    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE,
    version int NOT NULL,
    file_id uuid REFERENCES files(id) ON DELETE CASCADE,
    is_published boolean DEFAULT false,
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
    PRIMARY KEY (paper_id, user_id)
);

CREATE TABLE paper_fields (
    paper_id    bigint REFERENCES papers(id) ON DELETE CASCADE,
    field_id    bigint REFERENCES fields(id) ON DELETE CASCADE,
    PRIMARY KEY (paper_id, field_id)
);

CREATE TABLE paper_votes (
    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    score int,
    PRIMARY KEY (paper_id, user_id)
);

/******************************************************************************
 *  Reputation
 *****************************************************************************/

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

CREATE TYPE review_comment_status as ENUM('in-progress', 'posted');
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

/******************************************************************************
 * Responses 
 *****************************************************************************/

CREATE TYPE response_status AS ENUM('in-progress', 'posted');
CREATE TABLE responses (
    id  bigserial PRIMARY KEY,
    paper_id    bigint REFERENCES papers(id) ON DELETE CASCADE,
    user_id     bigint REFERENCES users(id) ON DELETE CASCADE,
    status  response_status,
    created_date    timestamptz,
    updated_date    timestamptz
);

/* Tech debt: stage database doesn't have this table up to date right now. */
CREATE TABLE response_versions (
    response_id bigint REFERENCES responses(id) ON DELETE CASCADE,
    version int NOT NULL,
    content text,
    created_date    timestamptz,
    updated_date    timestamptz,
    PRIMARY KEY(response_id, version)
);

