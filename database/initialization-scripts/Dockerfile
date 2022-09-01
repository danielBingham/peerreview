FROM postgres:14.2

ENV POSTGRES_PASSWORD='password'

ADD permissions.sql /
ADD schema.sql /
ADD fields.sql /
ADD field_relationships.sql /

ADD initialize.sh /docker-entrypoint-initdb.d

EXPOSE 5432 
