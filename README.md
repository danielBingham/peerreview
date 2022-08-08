# Peer Review

Peer Review is an open access, reputation based scientific publishing system
that has the potential to replace the journal system with a single, community
run website.  It is free to publish, free to access, and the plan is to support
it with donations and (eventually, hopefully) institutional support.

It allows academic authors to submit a draft of a paper for review by peers in
their field, and then to publish it for public consumption once they are ready.
It allows their peers to exercise post-publish quality control of papers by
voting them up or down and posting public responses.

When authors submit a draft for review, they tag it with up to five appropriate
fields (eg. 'biology', 'genetics').  Reputation is gained on a per field basis,
so only peers who have gained a sufficient amount of reputation in those fields
can see the draft and offer reviews.  The author(s) may accept or reject
reviews based on whether they find them helpful.  Accepted reviews grant the
reviewer a small amount of reputation (incentivizing reviewers to give helpful
reviews).

When the author(s) are ready, they can publish their draft to the site.  At
this point, peers with sufficient reputation in the tagged fields can vote the
paper up or down, based only on its quality.  They can post public responses
with feedback, criticism, suggestions, or plaudits.  Each up vote grants
reputation to the authors in the fields the paper is tagged with, each down
vote removes it.  It costs a small amount of reputation to downvote a paper, to
discourage frivolous downvotes or brigading.

To learn more about why we think the journal system need replacing, what
problems we hope Peer Review will solve, and how - read [the
Rationale](./rationale.md).

## Contributing

The tech stack is Nodejs and Express on the backend, React and Redux on the
frontend, and Postgres as a database. 

There is a [Github Project](
https://github.com/users/danielBingham/projects/6/views/1) setup with issues
and Milestones, however, these are a bit out of date.  There are planning
documents partially written in [Planning](./documentation/planning/), however,
these are only partially completed.

Right now, it's a one developer show and it will probably remain that way until
we reach an alpha prototype of the MVP.  Then we'll take stock, do more
detailed planning and break out tasks that will be easier for contributors to
pick up.

### Documentation

Documentation is partial and incomplete, but will be fleshed out over time.

- [API](./documentation/api/)
- [Planning](./documentation/planning)

### Running Locally

After pulling the github repo, you can run the development server by first running the PostgreSQL docker
container. To run peerreview, you can either use nodemon and the react dev server or build a Docker
container.

From the root project directory, build the postgres docker container:

```
$ cd database
$ docker build -t peer-sql .
```

Navigate back to the root directory and run the Postgres docker container:

```
$ cd ..
$ docker network create peer-network
$ docker run -d -p 5432:5432 --name peer-review-database-service --net peer-network peer-sql
```

Run ``npm install`` to install project dependencies:

```
$ npm install
```

Run the development server for react and node to allow hot reloading while you develop:

```
$ npm run dev
```

When you're ready to test your project in a more production like context, kill the development
server and build the app docker container.

From the root project directory:

```
$ docker build -t peer .
$ docker run -d -p 8080:8080 --name peer --net peer-network peer 
```

When you're done, make sure to clean up the two docker containers:

```
$ docker stop peer
$ docker stop peer-sql
$ docker rm peer
$ docker rm peer-sql
```
