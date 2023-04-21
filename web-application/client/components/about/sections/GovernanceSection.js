import React from 'react'
import ReactMarkdown from 'react-markdown'

const GovernanceSection = function(props) {

    return (
        <section id="governance">
            <h2>Governance and Structure</h2>
            <ReactMarkdown>
                {` 
Peer Review is an experiment. It is currently being run as a side project of a
single software engineer, [Daniel Bingham](#the-team).  As a
community forms, more and more decision making will happen in consultation with
the community.

If it begins to gain significant traction, we will form a non-profit,
multi-stakeholder cooperative to govern it. Multi-stakeholder cooperatives are
democratic organizations that are setup to be governed by multiple groups of
stakeholders in coordination. In this case, the two primary groups of
stakeholders would be the platform's users and the workers who build the
platform.  

This would likely be structured as a Board of Directors half of which would be
elected by the user base, the other half of which would be elected by the
workers who build the platform.

Most of the time the interests of the platform's workers and users will be
aligned.  But in the few cases where they aren't, it's important to include the
voices of both groups of stakeholders equally.

Having the users governing the platform through an elected board means we will
need to maintain a high degree of transparency.  For that governance to be
effective, users need to know what the issues are that effect the platform,
what goes into decision making, what the financial status is, and more. We will
commit to maintaining that degree of transparency.

We're attempting to improve on the Wikipedia model for governance of a web
platform.  This is the second experiment we hope to run with Peer Review.
Can we fix some or all of the problems that current plague the web's major
centralized platforms by introducing transparent, democratic governance?  We
hope to find out.
                `}
            </ReactMarkdown>
            <h3>Finances</h3>
            <ReactMarkdown>
                {`
Since Peer Review is currently being developed as a side project, all
development time is donated.  The primary expense is the AWS infrastructure.
The cost of running the production environment is currently about $200 month.
Running the staging environment also costs about $200 month.  The total monthly
cost for running Peer Review is currently about $400 / month.
                `}
            </ReactMarkdown>
            <img src="/img/aws-costs.png" />
            <ReactMarkdown>
                {`
[PostMark](https://postmark.com), the service that allows us to send emails (email confirmation,
password resets, etc), costs about $15 / month currently.

Donations given through [Github
Sponsors](https://github.com/sponsors/danielBingham) go directly towards these
infrastructure costs.
                `}
            </ReactMarkdown>
        </section>

    )
}

export default GovernanceSection
