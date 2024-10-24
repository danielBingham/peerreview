import React from 'react'
import ReactMarkdown from 'react-markdown'

import Field from '/components/fields/Field'

import './HowItWorksSection.css'

const HowItWorksSection = function(props) {

    return (
        <section id="how-it-works">
            <h2><a href="#how-it-works">How It Works</a></h2>
            <ReactMarkdown>
                {`
Peer Review uses a reputation system tied to a field tagging system to match
reviewers to the papers they are qualified to review.

Traditional peer review acts as both editorial feedback
for the authors prior to publication, and as integrity maintenance, filtering
bad or dishonest work out.  Peer Review splits those functions into different
systems, and for ease of reference we will use the following definitions:

- **review** refers to pre-publish editorial feedback for authors.
- **referee** refers to post-publish integrity management.

Users must pass a reputation threshold in a field before they can review or
referee papers in that field. Users gain reputation in a field first by
publishing to that field, and then by providing constructive review to their
peers.

`}
</ReactMarkdown>
<div>
    <a href="/fields">Fields</a> are tags arranged in a hierarchy, where each field can have multiple
        parents and children (eg. <Field id={156} /> is a child of both <Field id={1} /> and <Field id={12} />).
When reputation is gained in a child, it is also gained in that child's
parents.
</div>
<ReactMarkdown>
    {`

All papers posted to Peer Review are published under the [CC-BY 4.0 license](https://creativecommons.org/licenses/by/4.0/), meaning
the authors retain copyright, and anyone may reuse the work however they want as
long as they attribute the authors appropriately.  This also means that if you
wish to use Peer Review as a pre-print server with review before you publish
your work in a traditional journal you are welcome to do so.  Our end goal
is to replace the journal system, but we recognize that it will be a while
before that happens.
`}
</ReactMarkdown>
<h3 id="registering-and-getting-initial-reputation"><a href="#registering-and-getting-initial-reputation">Registering and Getting Initial Reputation</a></h3>
<ReactMarkdown>
    {`
When you register using your [ORCID iD](https://orcid.org), or when you connect your ORCID iD to
your user after you've registered, your reputation will be initialized 
using your existing works (as recorded in [OpenAlex](https://openalex.org)).
You'll receive 10 reputation points for each citation on each work you
are an author of.  OpenAlex's "concepts" map directly to Peer Review's
fields.

In this way, experienced scholars are able to start fully participating
immediately, without having to build a reputation on Peer Review separate from
their existing body of work.
`}
</ReactMarkdown>
            <h3 id="submitting-a-paper"><a href="#submitting-a-paper">Submitting a Paper</a></h3>
<ReactMarkdown>
    {`
When you are ready to submit a paper, you click the [submit](/submit) link in
the navigation bar.  From here you can enter the title of your paper, select up
to 10 fields to tag it with, and add your co-authors.  You can order your
co-authors and assign them permissions. 

Possible permissions are:

- **Owner**: able to upload new versions of the paper, accept or
reject reviews on the paper, and choose when to publish it,  
- **Commentor**: will gain reputation for being authors on the paper and
are able to participate in review discussion.
`}
</ReactMarkdown>
<img src="/img/how-it-works/submit-example.png" width={800}/>
<ReactMarkdown>
                {`
Finally, you'll need to select a PDF of your paper to upload.  Right now, Peer
Review can only support PDFs, but the intention is to add additional filetypes
in the future.

When you click "Submit Draft for Pre-Publish Review", the paper will enter the
pre-publish community review stage. 
`}
</ReactMarkdown>
            <h3 id="pre-publish-review"><a href="#pre-publish-review">Pre-Publish Review</a></h3>
<ReactMarkdown>
    {`
In pre-publish review, your paper will be visible to any users who have at
least **Review** reputation in any of the fields you tagged your paper with.
Users with **Review** reputation can submit reviews of your paper.  

Reviews at this stage are intended to help the authors by giving them
constructive, critical feedback. Authors should expect honest critical
feedback.  Reviewers should seek to give feedback that is constructive and
helpful.  Authors can reward feedback they find helpful by granting reviewers
reputation.

**Review** reputation will be a different threshold for each field, because
reputation thresholds are defined as multiples of the average reputation per
paper in a field. You can see what the reputation thresholds are for a
particular field by clicking on that field.
`}
</ReactMarkdown>
<img src="/img/how-it-works/field-reputation.png" width={800} />
<ReactMarkdown>
    {`

The review screen has two tabs showing two different views.  On the "Reviews"
tab, reviews are listed in chronological order, oldest to newest, with a
snapshot of the relevant piece of the paper for each comment thread.
`}
</ReactMarkdown>
<img src="/img/how-it-works/review-example-1.png" width={800} />
<ReactMarkdown>
    {`
On the "Drafts" tab, users can see a rendered PDF of the full paper, along with
all comments from all submitted reviews.  Comments are pinned the paper, and
are arranged to avoid overlap.  To center a comment on its pin either click the
comment or click the pin.
`}
</ReactMarkdown>
<img src="/img/how-it-works/review-example-2.png" width={800} />
<ReactMarkdown>
{`
Users can start a review by clicking the "Start Review" button.  

Reviewers can then add comments to their review by going to the Drafts tab and
clicking anywhere on the rendered PDF.  Each comment is pinned to the spot they
clicked on the paper.    
`}
</ReactMarkdown>
<ReactMarkdown>
    {`
Reviews that are still in progress are only visible to the reviewer writing
them.  Comments may be edited or deleted while the review is still in progress.  

Once the reviewer is ready, they can write up a summary of their review, select
a recommendation, and submit it.  Possible recommendations are:

- **Commentary**: No recommendation, just offering comments.
- **Recommend Changes**: Recommend the authors make the changes outlined in the
review.
- **Recommend Accept**: The reviewer considers this paper ready for publication
with no changes.
- **Recommend Reject**: The reviewer doesn't think this paper should be
published, or could be made publishable with changes.

Once the review is submitted, comments may no longer be edited or deleted.

Authors may reply to comments on reviews, as well as submit their own reviews.
Reviewers may also reply to each other's comments.

Authors who have **owner** permissions may **accept** reviews that they find
helpful, granting the reviewer 25 reputation.  They may **reject** reviews that
were unconstructive and unhelpful.  This doesn't remove reputation from the
reviewer, but it doesn't grant them any either.
`}
</ReactMarkdown>
<ReactMarkdown>
    {`
Authors who have **owner** permissions can upload as many versions of their
paper during the review stage as needed.  Each version gets its own round of
reviews, and reviewers can gain reputation for one **accepted** review on each
version of the paper.

When the authors are ready, those who have **owner** permissions can click
**publish** to "publish" the paper, making it publicly accessible and beginning
the **referee** stage.  We put publish in quotes here, because a paper
published on Peer Review is unlikely to be counted as version of record by most
academic institutions for the time being (initially it is likely to be
considered a pre-print, despite the review functions).  However, our goal is to
get to a point where a paper published on Peer Review does count as the version of
record.
`}
</ReactMarkdown>
            <h3 id="literature-integrity-maintenance"><a href="#literature-integrity-maintenance">Literature Integrity Maintenance</a></h3>
<ReactMarkdown>
    {`
Once a paper has been published, it becomes public for anyone to view.  The
pre-publish reviews and draft versions stay with the paper and become public
(read-only).
`}
</ReactMarkdown>
<img src="/img/how-it-works/published-example.png" width={800} />
<ReactMarkdown>
    {`
Users who have **referee** reputation in any of the fields the paper is tagged
with can vote and respond at this stage.
    `}
</ReactMarkdown>
<img src="/img/how-it-works/response-example.png" width={800} />
<ReactMarkdown>
    {`
**Up votes** grant the authors 10 reputation in each of the fields the paper is
tagged with.  **Down votes** remove 10 reputation from the authors in each of
the fields the paper is tagged with. Votes require responses of at least 125
words to explain the voters reasoning, and discourage gut level voting.
Responses do *not* require votes.  This is the primary mechanism through which
reputation is gained for new authors.

**Up votes** are for papers which represent honest, well done work - nothing
more or less.  For empiral papers, the methods are sound and well executed and
the conclusions are a reasonable interpretation of the results.   For
non-empiracal papers, the work is well done and the arguments are reasonably
sound.  Papers don't need to be perfect or free of mistakes to be worthy of up
votes. To learn more about the rationale for this, see [FAQ: When should I
vote?](#faq-when-should-i-vote)

**Down votes** are for dishonest work, fraud, or malpractice. 

There is a large grey area between "reasonable, well executed" and "malpractice"
and it will be up to each user to decide exactly where the lines lie.  In
general, if it's not fraud or malpractice, but isn't worthy of an up vote, then
referees should not vote and should simply write a response with their full
critique.

Using these definitions for votes, the paper's final score becomes a clear
signal for the public whether or not a paper is trustworthy.  A paper with a
positive score is reasonably well done, as assessed by the author's peers, and
is worthy of being included in any attempt to assess the literature for an
answer to a particular question.  A paper with a negative score should be
excluded.  A paper with no score, but lots of responses likely has some
significant issues and should probably be viewed with some skepticism. 

An author's reputation, gained from **up votes** on their papers and
**acceptance** of their reviews indicates whether they are a trustworthy,
knowledgeable, and good actor in their field - as assessed by the sum total of
their peers.
`}
</ReactMarkdown>
        </section>

    )

}

export default HowItWorksSection
