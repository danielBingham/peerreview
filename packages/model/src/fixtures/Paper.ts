import { QueryResult, ModelDictionary } from "../types/Results"
import { Paper } from "../types/Paper"
import { results as files } from "./File"

const papers: ModelDictionary<Paper> = {}

/******************************************************************************
 * Fixture 1: Single Author, Single Version Paper
 ******************************************************************************/
// @see packages/backend/test/fixtures/database.js -> papers[0]
papers[1] = {
    id: 1,
    title: 'Single Author, Single Version Paper',
    isDraft: true ,
    showPreprint: true,
    score: 1,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
    authors: [
        // Author 1
        // @see packages/backend/test/fixtures/database.js -> paper_authors[0]
        {
            userId: 1,
            order: 1,
            owner: true,
            submitter: true,
            role: 'corresponding-author',
        }
    ],
    versions: [
        // Version 1
        // @ see packages/backend/test/fixtures/database.js -> paper_versions[0]
        {
            version: 1,
            file: files.dictionary[1],
            content: 'This is the content of a single author, single version paper.',
            reviewCount: 0,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
        }

    ],
    fields: [ 1 ]
}

/******************************************************************************
 * Fixture 2: Multiple author, single version paper
 ******************************************************************************/

papers[2] = { 
    id: 2,
    title: 'Multiple Author, Single Version Paper',
    isDraft: true  ,
    showPreprint: false ,
    score: 2,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
    authors: [
        // Author 1
        // @see packages/backend/test/database.js -> paper_authors[1]
        {
            userId: 2,
            order: 1,
            owner: true,
            submitter: true,
            role: 'corresponding-author',
        },
        // Author 2
        // @see packages/backend/test/database.js -> paper_authors[2]
        {
            userId: 3,
            order: 2,
            owner: false,
            submitter: false,
            role: 'author',
        }

    ],
    versions: [
        // Version 1
        // @see packages/backend/test/database.js -> paper_versions[1]
        {
            version: 1,
            file: files.dictionary[2],
            content: 'This is the content of a multiple author, single version paper.',
            reviewCount: 0,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
        }
    ],
    fields: [ 1 ]
}

/******************************************************************************
 * Fixture 3: Single author, Multiple version paper
 ******************************************************************************/

papers[3] = { 
    id: 3,
    title: 'Single Author, Multiple Version Paper',
    isDraft: false ,
    showPreprint: true ,
    score: 3,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
    authors: [
        // Author 1
        // @see packages/backend/test/database.js -> paper_authors[3]
        {
            userId: 4,
            order: 1,
            owner: true,
            submitter: true,
            role: 'corresponding-author',
        }
    ],
    versions: [
        // Version 1
        // @see packages/backend/test/database.js -> paper_versions[2]
        {
            version: 1,
            file: files.dictionary[3],
            content: 'This is the content of a single author, multiple version paper.',
            reviewCount: 0,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
        },
        // Version 2
        // @see packages/backend/test/database.js -> paper_versions[3]
        {
            version: 2,
            file: files.dictionary[4],
            content: 'This is the content of a second version of a single author, multiple version paper.',
            reviewCount: 0,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
        }
    ],
    fields: [ 1 ]
}

/******************************************************************************
 * Fixture 4: Multiple author, Multiple version paper
 ******************************************************************************/

papers[4] = { 
    id: 4,
    title: 'Multiple Author, Multiple Version Paper',
    isDraft: false ,
    showPreprint: false ,
    score: 4,
    createdDate: 'TIMESTAMP',
    updatedDate: 'TIMESTAMP',
    authors: [
        // Author 1
        // @see packages/backend/test/database.js -> paper_authors[4]
        {
            userId: 5,
            order: 1,
            owner: true,
            submitter: true,
            role: 'corresponding-author',
        },
        // Author 2
        // @see packages/backend/test/database.js -> paper_authors[5]
        {
            userId: 6,
            order: 2,
            owner: false ,
            submitter: false ,
            role: 'author',
        }
    ],
    versions: [
        // Version 1
        // @see packages/backend/test/database.js -> paper_versions[4]
        {
            version: 1,
            file: files.dictionary[5],
            content: 'This is the content of a multiple author, multiple version paper.',
            reviewCount: 0,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
        },
        // Version 2
        // @see packages/backend/test/database.js -> paper_versions[5]
        {
            version: 2,
            file: files.dictionary[6],
            content: 'This is the content of a second version of a multiple author, multiple version paper.',
            reviewCount: 0,
            createdDate: 'TIMESTAMP',
            updatedDate: 'TIMESTAMP',
        }
    ],
    fields: [ 1 ]
}

export const results: QueryResult<Paper> = {
    dictionary: papers,
    list: Object.values(papers),
    meta: {
        count: Object.keys(papers).length,
        page: 1,
        pageSize: 20,
        numberOfPages: 1
    },
    relations: {}
}
