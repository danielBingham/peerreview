# Peer Review

Join the community and follow along!

- [Slack](https://join.slack.com/t/peer-review-io/shared_invite/zt-1hocmaafn-7dr~wuqnasfFMRXygD_HxA)
- [Twitter](https://twitter.com/PeerReviewIo)

If you have ideas, questions, or just want to talk open access and open science
feel free to join us in the slack, avail yourself of Github Discussions on
this repository, or tweet at us!

## Description

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
vote removes it.

## Contributing

The tech stack is Nodejs and Express on the backend, React and Redux on the
frontend, and Postgres as a database. 

Right now, it's a one developer show and in the push to get to an open beta
before we run out of runway, we've taken on some tech debt.  Some of which has
put the local environment out of comission for anyone who doesn't have access
to our Digital Ocean account. 

If you're interested in contributing code - the first project is getting the local
working again!

### Alpha Testing

If you can't code (or don't want to contribute code) but still want to
contribute, then you can help out by spending some time testing the alpha!  You
can find the alpha up on the staging server here: 

- [Peer Review - Staging](https://staging.peer-review.io)

Spend some time putting it through its paces and report any bugs you find.
There are three primary ways to report bugs:

- Send an email to [contact@peer-review.io](mailto:contact@peer-review.io)
- Open a bug issue here: [Bug Issue Template](https://github.com/danielBingham/peerreview/issues/new?assignees=&labels=&template=bug_report.md)
- Join the [Slack](https://join.slack.com/t/peer-review-io/shared_invite/zt-1hocmaafn-7dr~wuqnasfFMRXygD_HxA) and post in #bugs.

## Documentation

Documentation is partial and incomplete, but will be fleshed out over time.

You can find further documentation in the [Documentation](./documentation)
directory.

Some partially complete documents:

- [Running Locally](./documentation/running-locally.md)
- [API](./documentation/api/)
- [Planning](./documentation/planning)

