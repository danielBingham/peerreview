import React from 'react'
import ReactMarkdown from 'react-markdown'

import { Page, PageBody } from '/components/generic/Page'

import './TermsOfServicePage.css'

const TermsOfServicePage = function(props) {


    return (
        <Page id="terms-of-service">
            <PageBody>
                <article >
                    <h1>Terms of Service</h1>
                    <ReactMarkdown>
                        {`
1. **Use at your own risk.** Peer Review is an experimental academic publishing
platform that is currently in beta.  The platform is provided "as is" and we
make no guarantees about its functioning.  We cannot gaurantee that data
submitted to the platform will not be lost.  Use it at your own risk.

2. **We may remove users.** We reserve the right to remove users from the
platform who violate any laws, sanctions, or the community standards. 

3. **You own your content.** You retain ownership of and responsibility for all
content you generate.  This includes but is not limited to your papers,
reviews, responses, comments, and user bios.  You agree to share it on the
platform under a Creative Commons CC-BY 4.0 open license, allowing it to be
reproduced and distributed freely so long as you are appropriately attributed.

4. **We may remove content.** We reserve the right to remove any content that
violates the community standards.

5. **Community Standards.** You may not engage in harassment, abuse, or hate
speech.  You may not use the platform to distribute spam, misinformation, or
perpetrate fraud.


                `}
                    </ReactMarkdown>
                </article>
            </PageBody>
        </Page>
    )

}

export default TermsOfServicePage
