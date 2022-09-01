#!/bin/bash

set -e

# Create the user and the database from the default database so that we can give the user ownership of the database.
psql -a -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    CREATE ROLE app WITH LOGIN PASSWORD 'local-development';

    CREATE DATABASE peer_review OWNER app;
EOSQL

echo 'Setting permissions...'
psql -a -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "peer_review" --file="/permissions.sql"

echo 'Uploading Schema...'
psql -a -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "peer_review" --file="/schema.sql"

echo 'Creating the fields...'
psql -a -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "peer_review" --file="/fields.sql"

echo 'Creating the field relationships...'
psql -a -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "peer_review" --file="/field_relationships.sql"

psql -a -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "peer_review" <<-EOSQL
    DELETE FROM fields WHERE fields.id IN ( 
        SELECT fields.id FROM fields 
            LEFT OUTER JOIN field_relationships ON fields.id = field_relationships.child_id 
                WHERE field_relationships.parent_id IS NULL AND fields.type != fields.name
    );
EOSQL
