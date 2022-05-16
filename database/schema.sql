/* Initial permissions set up. */

REVOKE ALL ON SCHEMA public FROM PUBLIC ;
GRANT CONNECT ON DATABASE peer_review to app;

GRANT USAGE ON SCHEMA public TO app;
GRANT ALL ON ALL TABLES IN SCHEMA public TO app;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app;

/* Peer Review Schema file */

CREATE TABLE users (
    id    BIGSERIAL PRIMARY KEY,
    name  VARCHAR(256),
    password  VARCHAR(64),
    email     VARCHAR(256),
    created_date  TIMESTAMP,
    updated_date  TIMESTAMP
);

CREATE TABLE papers (
    id  BIGSERIAL PRIMARY KEY,
    title   VARCHAR(1024),
    filepath   VARCHAR(1024),
    created_date    TIMESTAMP,
    updated_date    TIMESTAMP
);

CREATE TABLE paper_authors (
    paper_id    BIGINT REFERENCES papers(id) ON DELETE CASCADE,
    user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE,
    author_order    INT,
    owner           BOOLEAN,
    PRIMARY KEY (paper_id, user_id)
);

