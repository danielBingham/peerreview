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
    id    bigserial PRIMARY KEY,
    name  varchar(256),
    password  varchar(64),
    email     varchar(256),
    created_date  timestamp,
    updated_date timestamp 
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
