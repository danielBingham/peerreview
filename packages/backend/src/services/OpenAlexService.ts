/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { Job } from 'bull'

import { Core, Logger, ServiceError } from '@danielbingham/peerreview-core' 



const AUTHORS = 'https://api.openalex.org/authors'
const WORKS = 'https://api.openalex.org/works'

export interface OpenAlexParams {
    filter?: string
    mailto?: string
}

/**
 * This was used for reputation generation in PeerReview 0.1.  It is currently
 * unused in JournalHub, but is retained in case we do choose to use OpenAlex
 * for future features.
 *
 * TODO Techdebt If we do choose to use this, we will need to create types
 * matching OpenAlex's return types. That work has been punted for now.
 */
export class OpenAlexService {
    core: Core
    logger: Logger

    constructor(core: Core) {
        this.core = core
        this.logger = core.logger
    }

    /**
     * Query an Open Alex endpoint with the given params.
     *
     * @param {string} endpoint The endpoint we want to query.
     * @param {object} params   An object of parameters to be fed to the endpoint, using URLSearchParams.
     *
     * @return {object} The response object from the `fetch()` query.
     */
    async queryOpenAlex(endpoint: string, params: OpenAlexParams): Promise<any> {
        params.mailto = "contact@peer-review.io"
        
        const searchParams = new URLSearchParams(params as any)
        
        return await fetch(endpoint + "?" + searchParams.toString(), {
            method: "GET"
        })
    }

    /**
     * Get an Author from Open Alex using their OpenAlexId.
     *
     * @param {string} openAlexId   The OpenAlexId we're going to use to fetch
     * the author from Open Alex.  A string of the form `A[0-9]+`
     *
     * @return {Object} The populated Author record from OpenAlex: https://docs.openalex.org/about-the-data/author
     */
    async getAuthor(openAlexId: string): Promise<any> {
        const response = await this.queryOpenAlex(AUTHORS, { filter: `openalex_id:${openAlexId}` })

        if ( ! response.ok ) {
            this.logger.error(`${AUTHORS}?filter=openalex_id:${openAlexId}`)
            this.logger.error(response)
            throw new ServiceError('authors-failed', `Failed to retrieve author from OpenAlex for Open Alex ID: ${openAlexId}.`)
        }

        const responseBody = await response.json()

        if ( responseBody.meta.count !== 1) {
            if ( responseBody.meta.count < 1) {
                throw new Error(`No Author for Open Alex ID: ${openAlexId}.`)
            } else {
                throw new Error(`Got multiple authors for Open Alex ID: ${openAlexId}`)
            }
        }

        return responseBody.results[0] 
    }

    /**
     * Get an Author from Open Alex using their ORCID iD.
     *
     * @param {string} orcidId  The ORCID iD of the author we're going to try to retrieve.
     *
     * @return {object} The populated Author record from OpenAlex: https://docs.openalex.org/about-the-data/author
     */
    async getAuthorWithOrcidId(orcidId: string): Promise<any> {
        const response = await this.queryOpenAlex(AUTHORS, { filter: `orcid:${orcidId}` }) 

        if ( ! response.ok ) {
            this.logger.error(`${AUTHORS}?filter=orcid:${orcidId}`)
            this.logger.error(response)
            throw new ServiceError('request-failed', `Failed to retrieve author from OpenAlex for ORCID iD ${orcidId}.`)
        }

        const responseBody = await response.json()

        if ( responseBody.meta.count !== 1) {
            if ( responseBody.meta.count < 1) {
                throw new ServiceError('no-author', `No Author for ORCID iD: ${orcidId}.`)
            } else {
                throw new ServiceError('multiple-authors', `Got multiple authors for ORCID iD: ${orcidId}`)
            }
        }

        return responseBody.results[0]
    }

    /**
     * Get a page of works for an author from Open Alex
     *
     * @param {object} author   An Author record from Open Alex: https://docs.openalex.org/about-the-data/author
     * @param {int} page    The page number we want to retrieve.
     *
     * @return {Object[]} An array of Open Alex Works records: https://docs.openalex.org/about-the-data/work
     */
    async getAuthorsWorksPage(author: any, cursor?: string): Promise<any> {
        cursor = cursor || '*'
        const response = await fetch(`${author.works_api_url}&per_page=200&cursor=${cursor}&mailto=contact@peer-review.io`, {
            method: "GET"
        })

        if ( ! response.ok ) {
            this.logger.error(`Errored on ${author.works_api_url}&page=${cursor}&per_page=200&mailto=contact@peer-review.io`)
            this.logger.error(response)
            throw new ServiceError('request-failed', `Failed to retrieve works for author ${author.id}, page ${cursor}`)
        }

        return await response.json()
    }

    /**
     * Get all works for an Author from Open Alex.
     *
     * @param {Object} author   An Author record from Open Alex:
     * https://docs.openalex.org/about-the-data/author
     * @param {Job} job (Optional) A bull queue job who's progress will be
     * updated if provided.
     *
     * @return {Object[]} An array of all Works records for the given Author
     * from Open Alex: https://docs.openalex.org/about-the-data/work
     */
    async getAuthorsWorks(author: any, job?: Job<any>): Promise<any[]> {
        if ( job ) {
            job.progress({ step: 'get-open-alex-author-works', stepDescription: `Getting works from Open Alex...`, progress: 0 })
        }

        // Make sure we handle OpenAlex's API rate limits appropriately.  The
        // documented rate limit is 10 rquests per second in the polite pool.
        //
        // https://docs.openalex.org/how-to-use-the-api/rate-limits-and-authentication
        let requestsMade = 0
        let batchStartTime = Date.now()
        this.logger.debug(`Starting request batch at ${batchStartTime}.`)

        const works = []
        const firstResponse = await this.getAuthorsWorksPage(author)


        if ( ! firstResponse ) {
            this.logger.error(firstResponse)
            throw new ServiceError('empty-page', 'Failed to retrieve works from Open Alex for author ' + author.display_name)
        }

        const total = firstResponse.meta.count
        let count = firstResponse.results.length
        let nextCursor = firstResponse.meta.next_cursor
        works.push(...firstResponse.results)

        if ( job ) {
            job.progress({ step: 'get-open-alex-author-works', stepDescription: `Getting works from Open Alex...`, progress: Math.floor((count/total)*100) })
        }

        while (nextCursor != null) {
            const worksResponse = await this.getAuthorsWorksPage(author, nextCursor)

            if ( ! worksResponse ) {
                this.logger.error(worksResponse)
                throw new ServiceError('empty-page', 'Works response failed for ' + count + ' of ' + total)
            }

            nextCursor = worksResponse.meta.next_cursor
            count += worksResponse.results.length
            works.push(...worksResponse.results)

            if ( job ) {
                job.progress({ step: 'get-open-alex-author-works', stepDescription: `Getting works from Open Alex...`, progress: Math.floor((count/total)*100) })
            }


            // Make sure we don't go over OpenAlex's rate limits.
            requestsMade += 1
            const currentTime = Date.now()
            const batchTime = currentTime - batchStartTime
            this.logger.debug(`Finished request #${requestsMade} in batch started at ${batchStartTime} at ${currentTime} with ${batchTime} taken so far.`)
            if ( requestsMade >= 9 && batchTime < 1000 ) {
                // If we've made at least 9 requests, sleep the rest of the second.
                // 9 requests to err on the side of caution and not push the limit.
                await new Promise((resolve, reject) => setTimeout(resolve, 1000-batchTime+1))

                // Start a new batch
                batchStartTime = Date.now()
                requestsMade = 0
            } else if ( requestsMade < 9 && batchTime > 1000 ) {
                // Reset the batch, the last one didn't hit the rate limit.
                batchStartTime = Date.now()
                requestsMade = 0
            }
        }

        return works
    }

    /**
     * Convert an Open Alex Concept display_name into a Peer Review Field Name.
     *
     * @param {string} displayName  A string representing the `concept.display_name` from Open Alex.
     *
     * @return {string} A field name matching Peer Review's field naming conventions.
     */
    getFieldNameFromConceptDisplayName(displayName: string): string {
        return displayName.trim().replaceAll(/[\/\\]/g, '-').replaceAll(/[^a-zA-Z0-9\-\.\s]/g, '').replaceAll(/\s/g, '-').toLowerCase()
    }


    /**
     * Get an array of papers with their fields and citations from Open Alex
     * for the given Open Alex Author record.
     *
     * @param {Object} author   The Open Alex author record to get papers for. 
     * @param {Job} job (Optional) A bull queue job who's progress will be
     * updated if provided.
     *
     * @return {Object[]}   An array of "papers", in this case Open Alex works
     * with their workId, citation numbers, and an array of concepts translated
     * into Peer Review field names.  Structure: 
     * ```
     * [
     *  {
     *     workId: <string>, // Open Alex Work.id
     *     citations: <int>, // The number of citations for that work.
     *     fields: [ <string> ] // An array of Peer Review field names.
     *  }
     * ]
     * ```
     */
    async getPapers(author: any, job?: Job): Promise<any[]> {
        const works = await this.getAuthorsWorks(author, job)

        if ( job ) {
            job.progress({ step: 'get-papers-from-works', stepDescription: `Processing works...`, progress: 0 })
        }

        const papers = []
        for(const work of works) {
            const fields = []
            for(const concept of work.concepts) {
                fields.push(this.getFieldNameFromConceptDisplayName(concept.display_name))
            }
            papers.push({
                workId: work.id,
                citations: work.cited_by_count,
                fields: fields 
            })

            if ( job ) {
                job.progress({ step: 'get-papers-from-works', stepDescription: `Processing works...`, progress: Math.floor((papers.length/works.length)*100) })
            }
        }

        return papers
    }

    /**
     * Get an array of papers with their work.id, citation, and Peer Review
     * fields for an ORCID iD.
     *
     * @param {string} orcidId  The ORCID iD we want to retrieve papers for.
     * @param {Job} job (Optional) A bull queue job who's progress will be
     * updated if provided.
     *
     * @return {Object[]}   An array of papers.  @see this.getPapers()
     */
    async getPapersForOrcidId(orcidId: string, job?: Job): Promise<any[]> {
        if ( job ) {
            job.progress({ step: 'get-open-alex-author', stepDescription: `Retrieving author record from Open Alex...`, progress: 0 })
        }

        const author = await this.getAuthorWithOrcidId(orcidId)
    
        if ( job ) {
            job.progress({ step: 'get-open-alex-author', stepDescription: `Retrieving author record from Open Alex...`, progress: 100 })
        }

        return await this.getPapers(author, job)
    }

    /**
     * Get an array of papers with their fields and citations from Open Alex
     * for a given openAlexId.
     *
     * @param {string} openAlexId   The openAlex_id for an Author record.
     *
     * @return {Object[]}   An array of papers. @see this.getPapers()
     */
    async getPapersForOpenAlexId(openAlexId: string): Promise<any[]> {
        const author = await this.getAuthor(openAlexId)
        return await this.getPapers(author)
    }


}
