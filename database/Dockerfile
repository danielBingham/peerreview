FROM postgres:14.2

ENV POSTGRES_PASSWORD='password'

ADD /initialization-scripts/permissions.sql /
ADD /test-data/testing_data.sql /dump.sql

ADD initialize_from_dump.sh /docker-entrypoint-initdb.d

EXPOSE 5432 
