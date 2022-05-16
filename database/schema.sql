/* Initial permissions set up. */

REVOKE ALL ON DATABASE peer_review FROM public;
GRANT CONNECT ON DATABASE peer_review to app;

CREATE SCHEMA root;

GRANT USAGE ON SCHEMA root TO app;
GRANT ALL ON ALL TABLES IN SCHEMA root TO app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA root TO app;

ALTER DEFAULT PRIVILEGES IN SCHEMA root GRANT ALL ON TABLES TO app;
ALTER DEFAULT PRIVILEGES IN SCHEMA root GRANT ALL ON SEQUENCES TO app;

/* Peer Review Schema file */

CREATE TABLE root.users (
    id    BIGSERIAL PRIMARY KEY,
    name  VARCHAR(256),
    password  VARCHAR(64),
    email     VARCHAR(256),
    created_date  TIMESTAMP,
    updated_date  TIMESTAMP
);

CREATE TABLE root.papers {
    id  BIGSERIAL PRIMARY KEY,
    title   VARCHAR(1024),
    file_path   VARCHAR(1024),
    owner_id    BIGINT REFERENCES root.users(id),
    created_date    TIMESTAMP,
    updated_date    TIMESTAMP
};

CREATE TABLE paper_authors {
    paper_id    BIGINT REFERENCES root.papers(id),
    user_id     BIGINT REFERENCES root.users(id),
    PRIMARY_KEY (paper_id, user_id)
};

