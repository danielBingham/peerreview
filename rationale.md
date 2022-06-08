# Peer Review - Rationale

Scientific publishing is broken.  We're still using a system that was developed
in the late 1600s and then privatized and monopolized starting in the early
1900s.  The privitization and monopolization mean that the results of
scientific research are inaccessible to the public, even though it's mostly
funded by the public. 

The five major publishers that own 80% of the journals are charging so much
that even some of the richest universities are starting to balk at the price.
But the effect of universities refusing to buy the journals is that researchers
won't have access to the full scope of the scientific literature.

In many parts of the world, it is already the case that researchers don't have
access to the scientific literature.  Researchers at universities in the
developing world cannot afford many of the journals, and can't afford to
publish in the open access journals.  This creates a collassal knowledge equity
problem.

It is already the case that the public doesn't have access to the vast majority
of the scientific literature.  This is already a massive problem for the
world's democracies.  Because in a democracy, the ultimate decision makers are
the individual citizens of the public.  And if they don't have access to the
scientific literature, then they don't know what our best guess at what is and
isn't true is, and they cannot make well informed decisions about what policies
would be best for their municipalities, states, regions, or countries.

The open access movement aimed to solve many of these problems, but - for the
most part - stuck with the existing journal model.  Instead of charging a fee
to access, most open access journals charge a fee to publish.  This created a
whole host of new problems and bad economic incentives.  The worst of which is
the drop in quality of many open access journals and the development of low
quality pay to play journals, willing to publish any work brought before them.

On top of these problems, the journal system has created a number of other
problems with in the scientific literature itself.

Journals want to publish results that are interesting and eye catching - giving
us the file drawer problem.  Journals want to publish novel results, so
replications are harder to publish.  Thus the replication crisis.  The above
put together with the pressure on researchers to publish in order to advance
their careers give rise to p-hacking.

To make matters even worse, the rise of pay to play journals have effectively
nullified the effects of pre-publish quality control peer review.  If a paper
gets rejected from a journal with strong quality controls, its authors can
simply take it to a pay to play journal with no refereeing and publish it
there.  As far as the public is concerned the effect is much the same - it got
published.  There are over 10,000 academic journals.  It's difficult for
academics to keep up with which ones are reputable and which ones are not.  For
the public, it's impossible.

With pay to play, the quality signal is lost entirely.

## How we Propose to Fix Them

We believe the journal system could be entirely replaced by a single web
application.  This site would effectively replace the journals with technology
that allows the research community to self organize peer review of papers.  It
would replace the opaque quality control of the journals with a system of
transparent post-publish quality control, again self organized by the community
of researchers and scientists.

In doing so, we believe we can build a system that could replace all of the
scientific journals at a tiny fraction of their current cost.  This would save
the research community a vast amount of money which could be redirected towards
funding actual research, and in the process would make the complete body of the
scientific literature freely available to public at large, while removing the
current barriers to equitable publishing and access to the literature for
scientists in the developing world entirely.

Since we'd be operating at a fraction of the cost of the journals, we believe
we can achieve sustainable funding through a mix of individual donations,
grants, and eventually support from the universities themselves (again, at a
small fraction of what they are currently paying).

In the process, we can immediately fix the file drawer problem, and potentially
offer future solutions for p-hacking.  We may also be able to help solve the
replication crisis by creating better incentives around replication.

We would achieve this by using a heirarchical tagging system to organize the
different scientific and academic fields and splitting the two functions of
peer review into different systems: with pre-publish editorial review helping
authors polish their work and post-publish quality control identifying bad
science for all to see.

We would achieve all of this using a reputation system linked to a tagging
system and a review system.

Here's how it would work in detail.  Authors with a paper ready for review
would submit it to the site as a PDF, latex file, or docx.  When they submit
it, they would add each of the authors on the paper and tag it with up to five
fields they deem appropriate. 

The fields exist in a hierarchy with reputation earned in subfields also
applying to all of a fields parent.  For example, a scientist with 500
reputation in 'genetics' would also have 500 reputation in 'biology'.  This
heirarchy would allow submitting authors to choose how specific they want to
be.  If they want feedback from all biologists, they can submit it tagged with
'biology', but if they want to limit their feedback to only geneticists, then
they can leave off the 'biology' tag and only add 'genetics'. 

Once they've added authors, fields, and uploaded their paper, it becomes a
draft and goes into the review queue.  All users with sufficient reputation in
the fields they tagged it with can see it as a paper awaiting review.  They can
self-select to offer reviews using the review system, which would allow them to
highlight areas of the document and attach comments.  If you've ever used
Google doc commments or Github's pull request review systems, then you have
some idea what to expect.

When the reviewers are ready, they submit their review with their
recommendation, one of "reject" meaning 'not ready for publication', 'request
changes' meaning 'almost there' or 'accept' meaning they think this is good to
publish.  Authors can then accept or reject the review, based on whether they
find it helpful.  Accepting a review grants reputation to the reviewer in the
fields of the paper.

As the author makes changes, they can upload new versions of their paper and
request additional rounds of review from their reviewers (and solicit
additional reviews).

When the author is ready, they publish their draft.

Once they publish their draft, it goes public.  At this point, peers in the
fields the paper is tagged in who have sufficient reputation can vote the paper
up or down and post their public responses to it with criticism, suggestions,
or plaudits.  Up votes grant reputation to the authors in the fields the paper
is tagged with, down votes remove it.

This post publish reputation system retains the quality control aspect of peer
review, but puts it where the public can see it.  It creates an incentive for
authors to take the pre-publish reviews seriously - if they ignore criticism it
could result in down votes once they publish and a loss of reputation for all
of them.  Down votes cost a small amount of reputation for the down voter to
discourage unnecessary downvoting and incentivize their use only when
appropriate.  If a paper is merely mediocre, then it just shouldn't be up
voted.

Responses allow peers to enumerate and explain their criticism, and in a place
where the public can see and follow along.

As you can see, this system retains and significantly improves upon the
important features of the journal system - editorial review, quality control,
limiting review to peers, reputation, and access.  And it does it in a single
site, drastically reducing the over head of academic publishing.

Our intention is to create a non-profit, structured as a multi-stakeholder
cooperative, to govern this proposed site.  Half the non-profits board would be
elected by and from the academic community, the other half by and from the
people building the site.  This would allow the site to be democratically
governed by the scientific community who depend on it.

If we can fund it through donations and institutional support, we can avoid the
bad incentives and problems created by both fee to access and fee to publish
systems.  We can make all scientific results free to access and free to
publish, eliminating the equity issues currently plaguing scientific
publishing.  By open sourcing the code, an ensuring the non-profit is
democratically governed, we can ensure the organization is held accountable and
that anyone can start over where we left off if it goes off the rails.

If we can raise enough funds to hire a reasonably sized software team, we can
explore building additional free tools to aid the scientific and academic
communities. Tools around sharing data.  Tools to help manage a lab.  AI and
machine learning to automate literature reviews, and help the public understand
what the literature says on any particular topic.  The sky is the limit.
