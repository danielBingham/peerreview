INSERT INTO `recipes` (`title`, `source_url`, `created_date`, `update_date`)
    VALUES ('Spinache Sautee', 'http://www.theroadgoeson.com', NOW(), NOW());

INSERT INTO `ingredients` (`name`) VALUES ('spinach'), ('olive oil'), ('salt');

INSERT INTO `recipe_ingredients` VALUES (1,1), (1,2), (1,3);
