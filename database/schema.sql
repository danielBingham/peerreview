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
    parent_id bigint REFERENCES fields(id) ON DELETE CASCADE,
    created_date timestamp,
    updated_date timestamp
);

INSERT INTO fields (name, parent_id, created_date, updated_date) 
    VALUES 
        ('biology', null, now(), now()), 
        ('physics', null, now(), now()),
        ('chemistry', null, now(), now()),
        ('earth-science', null, now(), now()),
        ('space-science', null, now(), now()), 
        ('anthropology', null, now(), now()), 
        ('archaeology', null, now(), now()), 
        ('economics', null, now(), now()), 
        ('geography', null, now(), now()), 
        ('political-science', null, now(), now()), 
        ('psychology', null, now(), now()), 
        ('sociology', null, now(), now()), 
        ('social-work', null, now(), now());

CREATE TABLE user_reputation (
    user_id bigint REFERENCES users(id) ON DELETE CASCADE,
    field_id bigint REFERENCES fields(id) ON DELETE CASCADE,
    reputation int,
    PRIMARY KEY (user_id, field_id)
);

CREATE TABLE papers (
    id  bigserial PRIMARY KEY,
    title   varchar(1024),
    is_draft   boolean,
    created_date    timestamp,
    updated_date    timestamp
);

CREATE TABLE paper_versions (
    paper_id    bigint REFERENCES papers(id) on DELETE CASCADE,
    version     serial,
    filepath    varchar(512),
    created_date    timestamp,
    updated_date    timestamp,
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

CREATE TYPE review_status AS ENUM('in-progress', 'rejected', 'changes-requested', 'approved');
CREATE TABLE reviews (
    id          bigserial PRIMARY KEY,
    paper_id    bigint REFERENCES papers(id) ON DELETE CASCADE,
    user_id     bigint REFERENCES users(id) ON DELETE CASCADE,
    summary     text,
    status      review_status,
    created_date    timestamp,
    updated_date    timestamp
);

CREATE TABLE review_comments (
    id          bigserial PRIMARY KEY,
    review_id   bigint REFERENCES reviews(id) ON DELETE CASCADE,
    parent_id   bigint REFERENCES reviews(id) ON DELETE CASCADE,
    page        int, 
    pin_x       int,
    pin_y       int,
    content     text,
    created_date    timestamp,
    updated_date    timestamp
);

