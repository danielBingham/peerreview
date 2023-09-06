import React from 'react'
import ReactMarkdown from 'react-markdown'

import { Page, PageBody } from '/components/generic/Page'

import './PrivacyPage.css'

const PrivacyPage = function(props) {


    return (
        <Page id="privacy">
            <PageBody>
                <article>
                    <h1>Privacy Policy</h1>
                    <ReactMarkdown>
                        {`
1. All content you provide is considered public with the exception of your
email and password.  You retain ownership of your content and share it under a
Creative Commons CC-By 4.0 license.

2. We do not and will not sell your content or information.  We only collect
the information necessary for the platform to function.

3. We may share some of your information with 3rd party data processors where it is
necessary for the functioning of the platform.  An example of this is sending
notification emails through PostMark (our email provider).

## Third Party Processors

Our third party processors currently consist of:

- [Amazon Web Services (AWS)](https://aws.amazon.com): Our hosting and cloud infrastructure provider.  All data is stored in AWS' cloud.
- [PostMark](https://postmark.com): Our email provider.
- [ORCID iD](https://orcid.org): An academic SSO provider.
- [OpenAlex](https://openalex.org): When you provide an ORCID iD we use it to search OpenAlex in order to provide you with initial reputation.

We may add additional providers as needed.
            `}
                    </ReactMarkdown>
                </article>
            </PageBody>
        </Page>
    )

}

export default PrivacyPage
