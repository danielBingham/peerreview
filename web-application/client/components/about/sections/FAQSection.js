import React from 'react'
import ReactMarkdown from 'react-markdown'

import "./FAQSection.css"

const FAQSection = function(props) {


    return (
        <section id="faq">
            <h2><a href="#faq">Frequently Asked Questions</a></h2>
            <p>Answers to questions, frequently asked.</p>
            <h3 id="faq-what-is-beta"><a href="#faq-what-is-beta">What does it mean for Peer Review to be in Beta?</a></h3>
            <ReactMarkdown>
                {`
Peer Review is currently in open Beta.  That means that the minimum set of
features necessary for it to function has been completed and tested to a
reasonably degree of thoroughness.  There are still features that we want to
implement before considering it "complete", and there are likely still bugs
that we haven't found.
                `}
            </ReactMarkdown>
            <h3 id="faq-why-experiment"><a href="#faq-why-experiment">What does it mean for Peer Review to be an experiment?</a></h3>
            <ReactMarkdown>
                {`
Just that - we don't know whether this will work or not, but we want to find
out! We want this experiment to work and will try hard to make it work, but
reserve the right to shut it down if it clearly isn't working.

Not working could look like a couple of things.  The obvious one is that it
doesn't get used.  

Another version of not working is people use it, but aren't willing to help
support it.  We can afford to maintain Peer Review up to a significant amount
of usage.  At a certain point, the infrastructure costs will grow larger than
we can support out of pocket.  If usage grows, but donations don't follow, we
could reach a point where we can no longer afford to support it, and have to
shut it down to avoid running out of money.  

A final version of not working is that the platform becomes a home for
misinformation or disinformation.  The goal is for the community to filter
spam, malpractice, and misinformation using the [Refereeing](#what-is-refereeing) system. If that
doesn't work out and misinformation finds a significant home here, we will shut
the platform down. 

We'll commit to keeping it up as long as it is being used, it's working as
intended, usage is growing at least a little, and costs don't completely
outstrip our ability to pay the bills.  We'll also commit to being completely
transparent about the costs, income, usage, and where the experiment stands.

So, given all that, for the time being it's best to treat Peer Review as a
non-archival pre-print server with built in review.
                `}
            </ReactMarkdown>
            <h3 id="faq-what-if-it-succeeds"><a href="#faq-what-if-it-succeeds">What if it succeeds?</a></h3>
            <ReactMarkdown>
                {` 
If the experiment succeeds, we will form a non-profit to manage it and hire a
team to build and run it.  Eventually, we'd love to see the platform supported
and governed by its users.
                `}
            </ReactMarkdown>
            <h3 id="faq-who-owns-copyright"><a href="#faq-who-owns-copyright">Who owns the copyright for works published on this platform?</a></h3>
            <ReactMarkdown> 
                {`
The authors do.  The works are published under the [CC-BY
4.0](https://creativecommons.org/licenses/by/4.0/) license.
`}
            </ReactMarkdown>
            <h3 id="faq-initial-reputation"><a href="#faq-initial-reputation">How can I get initial reputation?</a></h3>
            <ReactMarkdown>
                {` 
If you register with your [ORCID ID](https://orcid.org), or connect it to your account after
registering on the [account details](/account/details) page, then we will
attempt to generate initial reputation for you.

Initial reputation is generated using [OpenAlex](https://openalex.org/).  
                                                       
OpenAlex is an open database of scholarly works and their authors.  We will use
your ORCID ID to look up your author record on open alex, then we will examine
your publication record to try to generate reputation for you.  Papers in
OpenAlex are tagged with Concepts that map directly to Peer Review's fields.
For each paper we find, we will count one citation on a paper as an up vote,
and grant reputation in the tagged Concepts.  

This isn't a perfect system by any means.  OpenAlex's data is by far the best
free data we've found, but it is still incomplete and has disambiguation
issues.  The [OurResearch](https://ourresearch.org/) team is working tirelessly
to improve it, but it's a big task.

But this system does allow us to avoid the cold start problem with a reputation
system like this in a way that isn't manual and insanely costly.  Peer Review
wouldn't be possible with out OpenAlex providing that solution to us.

If you want Peer Review's initial reputation generation to improve, help
support [OpenAlex](https://openalex.org)!
                `}
            </ReactMarkdown>
            <h3 id="faq-what-are-fields"><a href="#faq-what-are-fields">What are fields?</a></h3>
            <ReactMarkdown>
                {`
[Fields](/fields) in Peer Review are areas of potential knowledge.  They exist in a
hierarchy, where each field can have multiple parents and multiple children.
At the very top of the heirarchy are the traditional academic disciplines
(physics, chemistry, biology, history, law, etc).  As one travels down the
hierarchy there are subdisciplines and eventually topics and concepts.

The hierarchy is currently 6 layers deep and consists of 65,000 fields.  The
goal is for fields to be editable for 1.0 and for the hierarchy to grow and
evolve as needed.
        `}
            </ReactMarkdown>
            <h3 id="faq-what-is-review"><a href="#faq-what-is-review">What is Review in the context of Peer Review?</a></h3>
            <ReactMarkdown>
                {` 
Review in the context of Peer Review refers to pre-publish editorial review.
This is the stage of review that happens before the paper has been shared
publicly on the platform.  At this stage, the paper is only visible to peers
who have **Review** reputation in one or more of the
[fields](#faq-what-are-fields) the paper is tagged with.  Any peer who can view
the paper can leave a review.

Reviews at this stage are intended to be constructive, critical feedback to
help the authors improve their work.  

When you are giving a review at this stage, you are speaking directly to the
authors.  Don't say anything in your review that you wouldn't say to their
faces.  Keep it constructive.  Think about the kind of feedback you want to
recieve.  

That doesn't mean you can't be critical. If you don't think the paper isn't
ready to be released, or has fundamental flaws, you should say so.  Just make
sure you keep it objectively about the work, and be as kind as possible when
communicating that.

Authors are able to accept reviews that they found constructive and helpful,
which grants the reviewer reputation.  They can also reject reviews they found
unconstructive, which doesn't remove reputation from the reviewer, but doesn't
grant any either.

When you are recieving review, you should expect, actively seek, and reward
good critical feedback.  

The goal of this stage is to help the authors produce the best paper possible
before they share it publicly.

Once a paper has been published, the pre-publish reviews on it become publicly
visible and read only.
                `}
            </ReactMarkdown>
            <h3 id="faq-what-is-refereeing"><a href="#faq-what-is-refereeing">What is Refereeing in the context of Peer Review?</a></h3>
            <ReactMarkdown>
                {` 
Refereeing is the second stage of review on Peer Review.  Refereeing occurs
post-publish, once a paper has been publicly released.

During refereeing, peers who have **Referee** reputation can submit
[Responses](#faq-what-is-a-response) to a paper.  Responses may include either
[Up Votes](#faq-what-is-an-up-vote) if the paper is reasonably well executed,
or [Down Votes](#faq-what-is-a-down-vote) if the paper is spam, misinformation,
fraud, or malpractice.  For a response to include a vote, it must be at least
125 words long explaining the reasoning for the vote. 

Papers that fall into the large grey area between "reasonably well executed"
and "malpractice" should recieve responses containing critical analysis, with
out votes either way.

Voting decisions should only be based on the **rigor** of the paper.  For more
information, see [What should I consider when
voting?](#faq-what-to-consider-when-voting). 

**Up Votes** grant the authors of the paper reputation in all of the
[fields](#faq-what-is-a-field) the paper is tagged with and all of their
parents. **Down Votes** remove reputation from the authors in the same.

The voting will be summed into a score given to the paper.  A positive score
indicates a generally well recieved paper.  A negative score indicates a paper
that shouldn't be trusted.  A low or zero score with a significant number of
responses indicates the paper was an honest attempt, but contains significant
flaws.

The point of refereeing is to maintain the integrity of the literature by
publicly responding to papers, and to recognize author's expertise and
knowledge.
                `}
            </ReactMarkdown>
            <h3 id="faq-what-is-a-response"><a href="#faq-what-is-a-response">What is a Response in the context of Peer Review?</a></h3>
            <ReactMarkdown>
                {` 
A response is the means through which peers can [referee](#faq-what-is-refereeing) a paper on Peer
Review.  Responses are critical analysis of a paper, posted publicly to the
paper after it has been published.  Peers who have **Referee** reputation in
any of the [fields](#faq-what-is-a-field) a paper is tagged with may post responses.  Peers who
participated in **Review** of the paper may still post responses. 

Responses can include votes, though they may also be posted with out a vote.
For a response to include a vote, it must be at least 125 words in length.
Responses that include votes should clearly explain the
reasoning for the vote.

See [What is refereeing?](#faq-what-is-refereeing), [What is an Up Vote?](#faq-what-is-an-up-vote), [What is a Down Vote?](#faq-what-is-a-down-vote), and [What should I consider when voting?](#faq-what-to-consider-when-voting)
                `}
            </ReactMarkdown>
            <h3 id="faq-what-is-reputation"><a href="#faq-what-is-reputation">What is Reputation?</a></h3>
            <ReactMarkdown>
                {` 
Reputation in Peer Review is intended to measure two things: a user's knowledge
or expertise in a field, and their peers trust in the user to be a good actor
in their interactions on Peer Review.

The primary way reputation is gained or lost is through publishing papers to
Peer Review and recieving responses with votes from peers.  [Up
Votes](#faq-what-is-an-up-vote) grant a paper's authors 10 reputation in all of
the [fields](#faq-what-is-a-field) a paper is tagged with, as well as their
parents.  [Down votes](#faq-what-is-a-down-vote) remove the same.

Reputation can also be gained by submitted constructive reviews to papers
during the [Review](#faq-what-is-review) stage, and having them accepted by the
paper's authors.  Accepted reviews grant the reviewer 25 reputation in the
**fields** a paper is tagged with, as well as their parents.

Users must gain a certain amount of reputation in a **field** before they can
participate in [Review](#faq-what-is-review) (**Review** reputation) or
[Refereeing](#faq-what-is-refereeing) (**Referee** reputation) of papers tagged
with that **field**.  

The reputation thresholds for each field are different.  Smaller fields with
fewer papers and fewer citations require less reputation to review and referee.
Larger fields require more.  You can view the thresholds for the field on the
field's page (for example, you can see the thresholds for [biology](/field/12)
here).

The threshold must only be met in one of the fields a paper is tagged with in
order to participate on that paper.
                `}
            </ReactMarkdown>
            <h3 id="faq-what-is-an-up-vote"><a href="#faq-what-is-an-up-vote">What is an Up Vote?</a></h3>
            <ReactMarkdown>
                {` 
An **Up Vote** indicates that the [referee](#faq-what-is-refereeing) believes
the paper is generally sound and reasonably rigourous.

For an empiracal work, it is generally well executed, the methods are sound,
and the conclusions are reasonable.

For a non-empiracal work, it is well constructed, well argued, and contains
sound reasoning.

See [What should I consider when voting?](#faq-what-to-consider-when-voting)
                `}
            </ReactMarkdown>
            <h3 id="faq-what-is-a-down-vote"><a href="#faq-what-is-a-down-vote">What is a Down Vote?</a></h3>
            <ReactMarkdown>
                {` 
A **Down Vote** indiciates that the [referee](#faq-what-is-refereeing) believes
the paper to be spam, malpractice, misinformation, or fraud.

See [What should I consider when voting?](#faq-what-to-consider-when-voting)
                `}
            </ReactMarkdown>
            <h3 id="faq-what-to-consider-when-voting"><a href="#faq-what-to-consider-when-voting">What should I consider when voting?</a></h3>
            <ReactMarkdown>
                {`
Journals traditionally ask reviewers to assess work using a number of criteria,
but votes on Peer review are only intended to measure a single criteria:
**rigor**.

If an empiracal work is well executed, the methods are sound, and the conclusions
reasonable then it is worthy of an **up vote**.

If a non-empiracal work is well constructed and well argued with sound
reasoning, then it is worthy of an **up vote**.

The work should not need to be perfect to be worthy of an up vote. It need not
have explored all possible avenues, be free of mistakes, and absent reasonable
counter arguments. Up votes are intended only to mark work that was
reasonably well done and executed honestly, in good faith. 

**Down votes** are for works which are fraudulent, malpractice, or
misinformation.

That assessment is, of course, subjective. And there's a large grey area
between "reasonably well done" and "malpractice".  So it will be up to each
user to decide where the lines lie for themselves.

There are a number of things that **shouldn't** be considered.  

Chief among them is **novelty**.  Science works in the aggregate.  To a large
extent, so too does the humanities.  Any individual paper could suffer mistakes
that could be missed in review.  Any individual set of authors will be prone to
their own biases, no matter how hard they try to resist them.  Each paper
merely represents a data point in the great database of human primary
knowledge.  And each data point is valuable and adds to that knowledge.
It is only when we've collected many data points on a particular topic
that we can begin to say we know anything about that topic.

Another feature that should not affect voting judgement is the **content of the
result**.  Null results and inconclusive results are just as valuable as positive
results.  Indeed, if there are 5 null results, several inconclusive results and
a positive result on a topic, probability suggests something went wrong with
the positive result.  As long as the methods were sound and well executed, null
and inconclusive results are an important contribution to the literature.

Finally, **impact** should not be considered in a voting decision.
Impact is something that's impossible to predict at the outset.  Seemingly
trite or niche papers could later turn out to be of significant importance.
Each paper provides useful knowledge and the state of our data storage
capacity now means we do not need to be picky about which knowledge we
store and which we do not.
`}
</ReactMarkdown>
        </section>
    )
}

export default FAQSection
