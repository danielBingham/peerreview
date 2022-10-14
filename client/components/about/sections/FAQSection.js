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
**Up votes** are for works that are honestly done and reasonably well done.
For empirical work that means the methods are sound, well executed and the
conclusions are a reasonable interpretation of the results. For non-empirical
work that means the research is reasonably well done and the arguments are
reasonably sound.  In neither case does it mean the work is perfect. It doesn't
mean all possible avenues of exploration have been covered, or there are no
mistakes, or that the arguments have no reasonable counter arguments. It is
intended purely as an assessment of work that was reasonably well done and
executed honestly, in good faith. 

**Down votes** are for works which are fraudulent, dishonestly executed, or are
so poorly executed that they fall into the category of malpractice.

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
`}
</ReactMarkdown>
        </section>
    )
}

export default FAQSection
