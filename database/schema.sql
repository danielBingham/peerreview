/* Initial permissions set up. */

REVOKE ALL ON SCHEMA public FROM PUBLIC ;
GRANT CONNECT ON DATABASE peer_review to app;

GRANT USAGE ON SCHEMA public TO app;
GRANT ALL ON SCHEMA public TO app;

GRANT ALL ON ALL TABLES IN SCHEMA public TO app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app;

/* Peer Review Schema file */

CREATE TABLE users (
    id bigserial PRIMARY KEY,
    blind_id varchar(64), 
    name varchar(256),
    password varchar(256),
    email varchar(256),
    initial_reputation int,
    reputation int,
    created_date timestamp,
    updated_date timestamp 
);

CREATE TABLE fields (
    id bigserial PRIMARY KEY,
    name varchar(512),
    type varchar(512), /* Name of the top level parent, used as a class to give the tag its color. */
    parent_id bigint REFERENCES fields(id) ON DELETE CASCADE,
    created_date timestamp,
    updated_date timestamp
);

INSERT INTO fields (name, parent_id, type, created_date, updated_date) 
    VALUES 
        ('physics', null, 'physics', now(), now()), /* 1 */
        ('chemistry', null, 'chemistry', now(), now()), /* 2 */
        ('biology', null, 'biology', now(), now()), /* 3 */
        ('earth-science', null, 'earth-science', now(), now()), /* 4 */
        ('space-science', null, 'space-science', now(), now()), /* 5 */ 
        ('anthropology', null, 'anthropology', now(), now()), /* 6 */
        ('archaeology', null, 'archaeology', now(), now()), /* 7 */ 
        ('economics', null, 'economics', now(), now()), /* 8 */ 
        ('geography', null, 'geography', now(), now()), /* 9 */
        ('political-science', null, 'political-science', now(), now()), /* 10 */
        ('psychology', null, 'psychology', now(), now()), /* 11 */
        ('sociology', null, 'sociology', now(), now()), /* 12 */
        ('social-work', null, 'social-work', now(), now()), /* 13 */
        ('computer-science', null, 'computer-science', now(), now()), /* 14 */
        ('mathematics', null, 'mathematics', now(), now()), /* 15 */
        ('agriculture', null, 'agriculture', now(), now()),
        ('architecture', null, 'architecture', now(), now()),
        ('business', null, 'business', now(), now()),
        ('education', null, 'education', now(), now()),
        ('engineering', null, 'engineering', now(), now()),
        ('environmental-studies', null, 'environmental-studies', now(), now()),
        ('consumer-science', null, 'consumer-science', now(), now()),
        ('recreation', null, 'recreation', now(), now()),
        ('media-studies', null, 'media-studies', now(), now()),
        ('law', null, 'law', now(), now()),
        ('library-science', null, 'library-science', now(), now()),
        ('medicine', null, 'medicine', now(), now()),
        ('military-science', null, 'military-science', now(), now()),
        ('public-administration', null, 'public-administration', now(), now()),
        ('social-work', null, 'social-work', now(), now()),
        ('transportation', null, 'transportation', now(), now()),

        /********** physics ********************/
        ('acoustics', 1, 'physics', now(), now()),
        ('aerodynamics', 1, 'physics', now(), now()),
        ('applied-physics', 1, 'physics', now(), now()),
        ('astrophysics', 1, 'physics', now(), now()),
        ('atomic-physics', 1, 'physics', now(), now()),
        ('molecular-physics', 1, 'physics', now(), now()),
        ('optical-physics', 1, 'physics', now(), now()),
        ('biophysics', 1, 'physics', now(), now()),
        ('computational-physics', 1, 'physics', now(), now()),
        ('condensed-matter-physics', 1, 'physics', now(), now()),
        ('cryogenics', 1, 'physics', now(), now()),
        ('electricity', 1, 'physics', now(), now()),
        ('electromagnetism', 1, 'physics', now(), now()),
        ('elementary-partical-physics', 1, 'physics', now(), now()),
        ('experimental-physics', 1, 'physics', now(), now()),
        ('fluid-dynamics', 1, 'physics', now(), now()),
        ('geophysics', 1, 'physics', now(), now()),
        ('mathematical-physics', 1, 'physics', now(), now()),
        ('mechanics', 1, 'physics', now(), now()),
        ('medical-physics', 1, 'physics', now(), now()),
        ('molecular-physics', 1, 'physics', now(), now()),
        ('newtonian-dynamics', 1, 'physics', now(), now()),
        ('nuclear-physics', 1, 'physics', now(), now()),
        ('optics', 1, 'physics', now(), now()),
        ('plasma-physics', 1, 'physics', now(), now()),
        ('quantum-physics', 1, 'physics', now(), now()),
        ('solid-mechanics', 1, 'physics', now(), now()),
        ('solid-state-physics', 1, 'physics', now(), now()),
        ('statistical-mechanics', 1, 'physics', now(), now()),
        ('theoretical-physics', 1, 'physics', now(), now()),
        ('thermal-physics', 1, 'physics', now(), now()),
        ('thermodynamics', 1, 'physics', now(), now());
        

CREATE TABLE user_reputation (
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    field_id bigint REFERENCES fields(id) ON DELETE CASCADE,
    reputation int,
    PRIMARY KEY (user_id, field_id)
);

CREATE TABLE files (
    id bigserial PRIMARY KEY,
    filepath varchar(1024),
    type varchar(256)
);

CREATE TABLE papers (
    id  bigserial PRIMARY KEY,
    title   varchar(1024),
    is_draft   boolean,
    created_date    timestamp,
    updated_date    timestamp
);

CREATE TABLE paper_versions (
    paper_id bigint REFERENCES papers(id) on DELETE CASCADE,
    version int NOT NULL,
    filepath varchar(512),
    type varchar(256),
    created_date timestamp,
    updated_date timestamp,
    PRIMARY KEY (paper_id, version)
);

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

CREATE TYPE review_status AS ENUM('in-progress', 'submitted', 'rejected', 'accepted');
CREATE TYPE review_recommendation as ENUM('reject', 'request-changes', 'approve');
CREATE TABLE reviews (
    id bigserial PRIMARY KEY,
    paper_id bigint REFERENCES papers(id) ON DELETE CASCADE,
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    version int,
    summary text,
    recommendation review_recommendation,
    status review_status,
    created_date timestamp,
    updated_date timestamp
);

CREATE TABLE review_comment_threads (
    id bigserial PRIMARY KEY,
    review_id bigint REFERENCES reviews(id) ON DELETE CASCADE,
    page        int, 
    pin_x       int,
    pin_y       int
);

CREATE TYPE review_comment_status as ENUM('in-progress', 'posted');
CREATE TABLE review_comments (
    id          bigserial PRIMARY KEY,
    thread_id   bigint REFERENCES review_comment_threads(id) ON DELETE CASCADE, 
    user_id     bigint REFERENCES users(id) ON DELETE CASCADE,
    thread_order int,
    status review_comment_status,
    content     text,
    created_date    timestamp,
    updated_date    timestamp
);

