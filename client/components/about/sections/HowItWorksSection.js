import React from 'react'
import ReactMarkdown from 'react-markdown'

const HowItWorksSection = function(props) {

    return (
        <section id="how-it-works">
            <h2>How It Works</h2>
            <ReactMarkdown>
                {`
Peer Review is a platform that allows scholars to self-organize peer review and
publishing by crowdsourcing reviews to qualified peers using a reputation
system. 

A note on definitions, Peer Review splits the two primary functions of
traditional peer review out into separate pieces.  Traditional peer review acts
as both editorial feedback for the authors prior to publication, and as
integrity control gatekeeping - to keep bad or dishonest work out of the
literature.  Peer Review splits those functions into different systems, and for
ease of reference we will use the following definitions:

- **review** refers to pre-publish editorial feedback for authors.
- **referee** refers to post-publish integrity management or quality control.

Users must register to create an account before they can submit a paper or
start reviewing papers.  Who can review and referee is controlled by reputation
gained in fields. 

Fields are tags arranged in a hierarchy, where each field can have multiple
parents and children (eg. biophysics is a child of both physics and biology).
When reputation is gained in a child, it is also gained in that child's
parents.

Reputation is primarily gained when qualified peers vote and respond on
published papers.  Up votes grant the authors 10 reputation in the fields the
paper is tagged with.  Down votes remove 10 reputation.  Votes are public must
be accompanied by written responses of at least 125 words to discourage gut
check voting.  

Once a user passes the reputation threshold for reviewing in a field, they may
offer pre-publish reviews and can gain reputation from their reviews.
`}
</ReactMarkdown>
<h3>Registering and Getting Initial Reputation</h3>
<ReactMarkdown>
    {`
When you register using your [ORCID iD](https://orcid.org), or when you connect your ORCID iD to
your user after you've registered, your reputation will be initialized by
counting citations on your existing works (as recorded in [OpenAlex](https://openalex.org).
You'll receive 10 reputation points for each citation on each work you
are recorded as author of.  OpenAlex's "concepts" map directly to Peer Review's
fields.

In this way, experienced scholars are able to start fully participating
immediately, without having to build a reputation on Peer Review separate from
their existing body of work.
`}
</ReactMarkdown>
<h3>Submitting a Paper</h3>
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
<img src="/img/how-it-works/submit-example.png" width={650}/>
<ReactMarkdown>
                {`
Finally, you'll need to select a PDF of your paper to upload.  Right now, Peer
Review can only support PDFs, but the intention is to add additional filetypes
in the future.

When you click "Submit Draft for Pre-Publish Review", the paper will enter the
pre-publish community review stage. 
`}
</ReactMarkdown>
<h3>Pre-Publish Review</h3>
<ReactMarkdown>
    {`
In pre-publish review, your paper will be visible to any users who have at
least **Review** reputation in any of the fields you tagged your paper with.
Authors and users with **Review** reputation can also submit reviews of your
paper.  

**Review** reputation will be a different threshold for each field, because
reputation thresholds are defined as multiples of the average reputation per
paper in a field.

Users can start a review by either clicking the "Begin Review" button or by
clicking anywhere on the rendered PDF of the paper.  Reviewers can then add
additional comments to their review by clicking anywhere on the rendered PDF.
Each comment is pinned to the spot they clicked on the paper.  Clicking on the
comment scrolls the paper to the pin, and clicking on the pin scrolls the
sidebar to the comment.  
`}
</ReactMarkdown>
<img src="/img/how-it-works/review-example.png" width={650} />
<ReactMarkdown>
    {`
Reviews that are still in progress are only visible to the reviewer writing
them.  Comments may be edited or deleted while the review is still in
progress.  Once the reviewer is ready, they can write up a summary of their
review, select a recommendation, and submit it.  Once the review is submitted,
comments may no longer be edited or deleted.

Authors may reply to comments on reviews, as well as submit their own reviews.
Reviewers may also reply to each other's comments.

`}
</ReactMarkdown>
        </section>

    )

}

export default HowItWorksSection
