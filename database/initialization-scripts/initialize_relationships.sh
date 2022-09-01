#!/bin/bash

echo 'Creating the fields...'
psql -a -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "peer_review" --file="/fields.sql"

echo 'Creating the field relationships...'
psql -a --username "$POSTGRES_USER" --dbname "peer_review" --file="/field_relationships.sql"
