/* Peer Review Schema file */

CREATE TABLE `users` (
    `id`    BIGINT unsigned NOT NULL AUTO_INCREMENT,
    `name`  VARCHAR(256),
    `password`  VARCHAR(64),
    `email`     VARCHAR(256),
    PRIMARY KEY (`id`),
    INDEX `name` (`name`)
);

CREATE TABLE `papers` (
    `id`    BIGINT unsigned NOT NULL AUTO_INCREMENT,
    `title` VARCHAR (512),
    `content`   TEXT,
    `url`       VARCHAR(512),
    PRIMARY KEY (`id`),
    INDEX `title` (`title`),
    INDEX `content` (`content`)
);

CREATE TABLE `paper_authors` (
    `user_id`   BIGINT unsigned NOT NULL,
    `paper_id`  BIGINT unsigned NOT NULL,
    `author_order`     INT unsigned NOT NULL,
    PRIMARY KEY (`user_id`,`paper_id`) 
);
    


