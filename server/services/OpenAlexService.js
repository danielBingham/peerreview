
const AUTHORS = 'https://api.openalex.org/authors'
const WORKS = 'https://api.openalex.org/works'

module.exports = class OpenAlexService {

    constructor(logger) {
        this.logger = logger
    }

    /**
     * Query an Open Alex endpoint with the given params.
     *
     * @param {string} endpoint The endpoint we want to query.
     * @param {object} params   An object of parameters to be fed to the endpoint, using URLSearchParams.
     *
     * @return {object} The response object from the `fetch()` query.
     */
    async queryOpenAlex(endpoint, params) {
        params.mailto = "contact@peer-review.io"
        
        const searchParams = new URLSearchParams(params)

        console.log('Making query: ' + endpoint + "?" + searchParams.toString())
        
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
    async getAuthor(openAlexId) {
        const response = await this.queryOpenAlex(AUTHORS, { filter: `openalex_id:${openAlexId}` })

        if ( ! response.ok ) {
            throw new Error(`Filed to retrieve author from OpenAlex for Open Alex ID: ${openAlexId}.`)
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
    async getAuthorWithOrcidId(orcidId) {
        const response = await this.queryOpenAlex(AUTHORS, { filter: `orcid:${orcidId}` }) 

        if ( ! response.ok ) {
            throw new Error(`Failed to retrieve author from OpenAlex for ORCID iD ${orcidId}.`)
        }

        const responseBody = await response.json()

        if ( responseBody.meta.count !== 1) {
            if ( responseBody.meta.count < 1) {
                throw new Error(`No Author for ORCID iD: ${orcidId}.`)
            } else {
                throw new Error(`Got multiple authors for ORCID iD: ${orcidId}`)
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
    async getAuthorsWorksPage(author, page) {
        console.log('Fetching page: ' + author.works_api_url)
        const response = await fetch(`${author.works_api_url}&page=${page}&per_page=200&mailto=contact@peer-review.io`, {
            method: "GET"
        })

        if ( ! response.ok ) {
            throw new Error(`Failed to retrieve works for author ${author.id}, page ${page}`)
        }

        return await response.json()
    }

    /**
     * Get all works for an Author from Open Alex.
     *
     * @param {Object} author   An Author record from Open Alex: https://docs.openalex.org/about-the-data/author
     *
     * @return {Object[]} An array of all Works records for the given Author
     * from Open Alex: https://docs.openalex.org/about-the-data/work
     */
    async getAuthorsWorks(author) {
        console.log('Getting works for author: ')
        console.log(author)
        const works = []

        const firstResponse = await this.getAuthorsWorksPage(author, 1)

        if ( ! firstResponse ) {
            throw new Error('Failed to retrieve works from Open Alex for author ' + author.display_name)
        }

        const count = firstResponse.meta.count
        const perPage = firstResponse.meta.per_page
        works.push(...firstResponse.results)

        let numberOfPages = parseInt(count / perPage) + ( count % perPage > 0 ? 1 : 0)
        for(let page = 2; page <= numberOfPages; page++) {
            const worksResponse = await this.getAuthorsWorksPage(author, page)

            if ( ! worksResponse ) {
                throw new Error('Works response failed for page ' + page + ' of ' + numberOfPages)
            }

            works.push(...worksResponse.results)
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
    getFieldNameFromConceptDisplayName(displayName) {
        return displayName.trim().replaceAll(/[\/\\]/g, '-').replaceAll(/[^a-zA-Z0-9\-\.\s]/g, '').replaceAll(/\s/g, '-').toLowerCase()
    }


    /**
     * Get an array of papers with their fields and citations from Open Alex
     * for the given Open Alex Author record.
     *
     * @param {Object} author   The Open Alex author record to get papers for. 
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
    async getPapers(author) {
        const works = await this.getAuthorsWorks(author)

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
        }
        return papers
    }

    /**
     * Get an array of papers with their work.id, citation, and Peer Review
     * fields for an ORCID iD.
     *
     * @param {string} orcidId  The ORCID iD we want to retrieve papers for.
     *
     * @return {Object[]}   An array of papers.  @see this.getPapers()
     */
    async getPapersForOrcidId(orcidId) {
        const author = await this.getAuthorWithOrcidId(orcidId)
        return await this.getPapers(author)
    }

    /**
     * Get an array of papers with their fields and citations from Open Alex
     * for a given openAlexId.
     *
     * @param {string} openAlexId   The openAlex_id for an Author record.
     *
     * @return {Object[]}   An array of papers. @see this.getPapers()
     */
    async getPapersForOpenAlexId(openAlexId) {
        const author = await this.getAuthor(openAlexId)
        return await this.getPapers(author)
    }


}
