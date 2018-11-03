FROM mysql/mysql-server:5.7

ENV MYSQL_DATABASE='peer_review' \
    MYSQL_ROOT_PASSWORD='password'

ADD schema.sql /docker-entrypoint-initdb.d
ADD test-data.sql /docker-entrypoint-initdb.d
ADD grants.sql /docker-entrypoint-initdb.d

EXPOSE 3306
