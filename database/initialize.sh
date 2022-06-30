#!/bin/bash

set -e

# Create the user and the database from the default database so that we can give the user ownership of the database.
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE app WITH LOGIN PASSWORD 'local-development';

    CREATE DATABASE peer_review OWNER app;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "peer_review" --file="/schema.sql"
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "peer_review" --file="/fields.sql"
