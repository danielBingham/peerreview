FROM postgres:14.2

ENV POSTGRES_PASSWORD='password'

ADD schema.sql /
ADD initialize.sh /docker-entrypoint-initdb.d

EXPOSE 5432 
