import React from 'react'
import ReactMarkdown from 'react-markdown'

const FAQSection = function(props) {

    return (
        <section id="faq">
            <h2>Frequently Asked Questions</h2>
            <p>Answers to questions, frequently asked.</p>
            <h3>Who owns the copyright for works published on this platform?</h3>
            <ReactMarkdown> 
                {`
The authors do.  The works are published under the [CC-BY
4.0](https://creativecommons.org/licenses/by/4.0/) license.
`}
            </ReactMarkdown>
            <h3 id="faq-when-should-i-vote">When should I vote?</h3>
            <ReactMarkdown>
                {`
Journals traditionally ask reviewers to assess work using a number of criteria,
but votes on Peer review are only intended to measure a single criteria -
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
<h3 id="faq-what-are-fields">What are fields?</h3>
<ReactMarkdown>
    {`
Fields in Peer Review are areas of potential knowledge.  They exist in a
hierarchy, where each field can have multiple parents and multiple children.
At the very top of the heirarchy are the traditional academic disciplines
(physics, chemistry, biology, history, law, etc).  As one travels down the
hierarchy there are subdisciplines and eventually topics and concepts.

The hierarchy is currently 6 layers deep and consists of 65,000 fields.  The
plan is for fields to be editable and for the hierarchy to grow and evolve as
needed.
`}
</ReactMarkdown>
        </section>
    )
}

export default FAQSection
