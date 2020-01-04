## What are we doing?
**Author:** danielbingham

*How do we plan to solve this story? This should include a detailed plan of attack with prototypes, designs, and a description of any proposed code changes.*

Defining an intial database structure for peer review.  Initially, lets just
start with users and papers, since the ability to create a user and publish a
paper is the minimum necessary.

First we'll need a users table to store the paper's authors.

```
CREATE TABLE `users` (
    `id`    BIGINT unsigned NOT NULL AUTO_INCREMENT,
    `name`  VARCHAR(256),
    `password`  VARCHAR(64),
    `email`     VARCHAR(256),
    PRIMARY KEY (`id`),
    INDEX `name` (`name`)
);
```
* `id` is the primary key for the users.
* `name` is the user's display name, which we will strongly encourage to be their full, real name that they publish under.
* `password` is a strong password.
* `email` is their email.

We'll also need a paper's table.  We'll assume the papers we're getting are
PDF, and that there's a path to them.  We'll include a text content field on
the assumption that we might later acept latex, or try to pull the text
contents out of the PDFs when they are uploaded for searching or display
purposes.

```
CREATE TABLE `papers` (
    `id`    BIGINT unsigned NOT NULL AUTO_INCREMENT,
    `title` VARCHAR (512),
    `content`   TEXT,
    `url`       VARCHAR(512),
    PRIMARY KEY (`id`),
    INDEX `title` (`title`),
    INDEX `content` (`content`)
);
```

* `id` is the primary key.
* `title` is the paper's title.
* `content` is the paper's content, assuming we'll eventually find some way to pull the content out of the PDF papers (or provide an editor, or take LaTex).
* `url` is the path to the uploaded PDF.

We'll also need a tagging table linking authors to papers, since there can be
more than one author.

```
CREATE TABLE `paper_authors` (
    `user_id`   BIGINT unsigned NOT NULL,
    `paper_id`  BIGINT unsigned NOT NULL,
    `order`     INT unsigned NOT NULL,
    PRIMARY KEY (`user_id`,`paper_id`) 
);
```

* `user_id` is the id in the `users` table for the author.
* `paper_id` is the paper's primary key.
* `order` is the order in which the author's names appear on the paper.  `1` being the first author listed, `2` the second, and so on.

We don't need an `id` for this table, since no Author will be listed twice on
the same paper, so the combination of `user_id` and `paper_id` should be
unique.

## What are the alternatives?
**Author:** danielbingham

*What are the alternative solutions we considered, but ultimately decided against?*

We could flesh out more of the database, but I decided to keep it to the
absolute minimum required to get things moving.

## What are we not doing?
**Author:** danielbingham

*Is there anything we explicitly decided not to pursue as part of this story?  Why?*

Fleshing out more of the database.
