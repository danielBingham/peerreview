
const AUTHORS = 'https://api.openalex.org/authors'
const WORKS = 'https://api.openalex.org/works'

module.exports = class OpenAlexService {

    constructor(logger) {
        this.logger = logger
    }

    async queryOpenAlex(endpoint, params) {
        params.mailto = "contact@peer-review.io"
        
        const searchParams = new URLSearchParams(params)

        return await fetch(endpoint + "?" searchParams.toString(), {
            method: "GET"
        })
    }

    async getAuthor(orcidId) {
        const response = await this.queryOpenAlex(AUTHORS, { filter: `orcid: ${orcidId}` }) 

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

        return result.results[0]
    }

    async getAuthorsWorksPage(author, page) {

        const response = await this.queryOpenAlex(author.works_api_uri, { page: page, "per-page": 200 })

        if ( ! response.ok ) {
            throw new Error(`Failed to retrieve works for author ${author.id}, page ${page}`)
        }

        return await response.json()
    }

    async getAuthorsWorks(orcidId) {
        const author = await this.getAuthor(orcidId)

        if ( ! author ) {
            throw new Error('Failed to retrieve author for ORCID iD: ' + orcidId)
        }

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

    getFieldNameFromConceptDisplayName(displayName) {
        return displayName.trim().replaceAll(/[\/\\]/g, '-').replaceAll(/[^a-zA-Z0-9\-\s]/g, '').replaceAll(/\s/g, '-').toLowerCase()
    }

    async getPapersForOrcidId(orcidId) {
        const works = getAuthorsWorks(orcidId)

        const papers = []
        for(const work of works) {
            const fields = []
            for(const concept of work.concepts) {
                fields.push(this.getFieldNameFromConceptDisplayName(concept.display_name))
            }
            papers.push({
                citations: work.cited_by_count,
                fields: fields 
            })
        }



    }


}
