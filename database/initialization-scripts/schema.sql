/* Peer Review Schema file */

/* Allows us to do fuzzy finding. */
CREATE EXTENSION pg_trgm;

/******************************************************************************
 * Users 
 *****************************************************************************/

CREATE TYPE user_status AS ENUM('invited', 'unconfirmed', 'confirmed');
CREATE TABLE users (
    id bigserial PRIMARY KEY,
    blind_id uuid DEFAULT gen_random_uuid(), 
    orcid_id varchar(256),
    status user_status DEFAULT 'unconfirmed',
    name varchar(256),
    password varchar(256),
/*    file_id uuid REFERENCES files(id), Added below with an alter statement. */
    email varchar(256),
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
ALTER TABLE users ADD COLUMN file_id uuid REFERENCES files(id);
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
    is_draft   boolean,
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

