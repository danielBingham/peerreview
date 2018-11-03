/* Peer Review Schema file */

CREATE TABLE `recipes` (
    `id`    BIGINT unsigned NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(512),
    `source_url`    VARCHAR(512),
    `created_date`  DATETIME,
    `update_date`   DATETIME,
    PRIMARY KEY(`id`),
    INDEX `title` (`title`)
);

CREATE TABLE `ingredients` (
    `id`    BIGINT unsigned NOT NULL AUTO_INCREMENT,
    `name`  VARCHAR(512),
    PRIMARY KEY(`id`),
    INDEX `name` (`name`)
);

CREATE TABLE `recipe_ingredients` (
    `recipe_id`     BIGINT unsigned NOT NULL,
    `ingredient_id` BIGINT unsigned NOT NULL,
    PRIMARY KEY(`recipe_id`,`ingredient_id`)
);
    


