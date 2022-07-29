#!/bin/bash

set -e

function usage() {
    cat <<USAGE
Usage: $0 --user <username> --host <host>

Initializing the Peer Review staging database found at <host> and accessible by
<username>.  You will be prompted for the <password> that goes with <username>

Options:
    -u <username> | --user <username>:   The username of the admin database user.
    -h <host> | --host <host>:  The host url for the database.
USAGE
    exit 1
}

if [ $# -eq 0 ]; 
then
    usage
    exit 1
fi

read -s -p "Password: " PASSWORD

USERNAME=
HOST=

for arg in "$@"; do
    case $arg in
        -u | --user)
            USERNAME=$2
            shift
            shift
            ;;
        -h | --host)
            HOST=$2
            shift
            shift
            ;;
        -h | --help)
            usage
            ;;
        *)
            usage
            ;;
    esac
done

APP_PASSWORD=$(cat /dev/urandom | tr -dc '[:alnum:]' | head -c 64)
echo "Password for 'app' user: $APP_PASSWORD."

# Create the user and the database from the default database so that we can give the user ownership of the database.
PGPASSWORD=$PASSWORD psql -v ON_ERROR_STOP=1 --host "$HOST" --username "$USERNAME" --dbname "defaultdb" --port 25060 <<-EOSQL
    CREATE ROLE app WITH LOGIN PASSWORD '$APP_PASSWORD';

    CREATE DATABASE peer_review OWNER app;
EOSQL

DATABASE_PATH="$(dirname $(dirname $(realpath $0)))/database"

PGPASSWORD=$APP_PASSWORD psql -v ON_ERROR_STOP=1 --host "$HOST" --username "app" --dbname "peer_review" --port 25060 --file="$DATABASE_PATH/schema.sql"
PGPASSWORD=$APP_PASSWORD psql -v ON_ERROR_STOP=1 --host "$HOST" --username "app" --dbname "peer_review" --port 25060 --file="$DATABASE_PATH/fields.sql"

