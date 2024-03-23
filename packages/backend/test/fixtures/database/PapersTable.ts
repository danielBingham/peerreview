import { QueryResult } from 'pg'

import { files } from './FilesTable'

export const paper_authors = [
    // 0
    // @see packages/model/fixtures/Paper.js -> Fixture 1, author 1 
    {
        PaperAuthor_userId: 1,
        PaperAuthor_order: 1,
        PaperAuthor_owner: true,
        PaperAuthor_submitter: true,
        Role_id: 1,
        Role_name: 'corresponding-author'
    },
    // 1
    // @see packages/model/fixtures/Paper.js -> Fixture 2, author 1 
    {
        PaperAuthor_userId: 2,
        PaperAuthor_order: 1,
        PaperAuthor_owner: true,
        PaperAuthor_submitter: true,
        Role_id: 1,
        Role_name: 'corresponding-author'
    },
    // 2
    // @see packages/model/fixtures/Paper.js -> Fixture 2, author 2 
    {
        PaperAuthor_userId: 3,
        PaperAuthor_order: 2,
        PaperAuthor_owner: false,
        PaperAuthor_submitter: false,
        Role_id: 2,
        Role_name: 'author'
 
    },
    // 3
    // @see packages/model/fixtures/Paper.js -> Fixture 3, author 1 
    {
        PaperAuthor_userId: 4,
        PaperAuthor_order: 1,
        PaperAuthor_owner: true,
        PaperAuthor_submitter: true,
        Role_id: 1,
        Role_name: 'corresponding-author'
    },
    // 4
    // @see packages/model/fixtures/Paper.js -> Fixture 4, author 1 
    {
        PaperAuthor_userId: 5,
        PaperAuthor_order: 1,
        PaperAuthor_owner: true,
        PaperAuthor_submitter: true,
        Role_id: 1,
        Role_name: 'corresponding-author'
    },
    // 5
    // @see packages/model/fixtures/Paper.js -> Fixture 4, author 2 
    {
        PaperAuthor_userId: 6,
        PaperAuthor_order: 2,
        PaperAuthor_owner: false,
        PaperAuthor_submitter: false,
        Role_id: 2,
        Role_name: 'author'
    }
]

export const paper_versions = [
    // 0
    // @see packges/model/fixtures/Paper.js -> Fixture 1, Version 1 
    {     
        PaperVersion_version: 1,
        PaperVersion_content: 'This is the content of a single author, single version paper.',
        PaperVersion_reviewCount: 0,
        PaperVersion_createdDate: 'TIMESTAMP',
        PaperVersion_updatedDate: 'TIMESTAMP'
    },
    // 1
    // @see packages/model/fixtures/Paper.js -> Fixture 2, Version 1 
    {
        PaperVersion_version: 1,
        PaperVersion_content: 'This is the content of a multiple author, single version paper.',
        PaperVersion_reviewCount: 0,
        PaperVersion_createdDate: 'TIMESTAMP',
        PaperVersion_updatedDate: 'TIMESTAMP',
    },
    // 2
    // @see packages/model/fixtures/Paper.js -> Fixture 3, Version 1 
    {
        PaperVersion_version: 1,
        PaperVersion_content: 'This is the content of a single author, multiple version paper.',
        PaperVersion_reviewCount: 0,
        PaperVersion_createdDate: 'TIMESTAMP',
        PaperVersion_updatedDate: 'TIMESTAMP',
    },
    // 3
    // @see packages/model/fixtures/Paper.js -> Fixture 3, Version 2 
    {
        PaperVersion_version: 2,
        PaperVersion_content: 'This is the content of a second version of a single author, multiple version paper.',
        PaperVersion_reviewCount: 0,
        PaperVersion_createdDate: 'TIMESTAMP',
        PaperVersion_updatedDate: 'TIMESTAMP',
    },
    // 4
    // @see packages/model/fixtures/Paper.js -> Fixture 4, Version 1 
    {
        PaperVersion_version: 1,
        PaperVersion_content: 'This is the content of a multiple author, multiple version paper.',
        PaperVersion_reviewCount: 0,
        PaperVersion_createdDate: 'TIMESTAMP',
        PaperVersion_updatedDate: 'TIMESTAMP',
    },
    // 5
    // @see packages/model/fixtures/Paper.js -> Fixture 4, Version 2 
    {
        PaperVersion_version: 2,
        PaperVersion_content: 'This is the content of a second version of a multiple author, multiple version paper.',
        PaperVersion_reviewCount: 0,
        PaperVersion_createdDate: 'TIMESTAMP',
        PaperVersion_updatedDate: 'TIMESTAMP',
    }
]

export const papers = [
    // 0
    // @see packages/model/fixtures/Paper.js -> Fixture 1
    { 
        Paper_id: 1,
        Paper_title: 'Single Author, Single Version Paper',
        Paper_isDraft: true,
        Paper_showPreprint: true,
        Paper_score: 1,
        Paper_createdDate: 'TIMESTAMP',
        Paper_updatedDate: 'TIMESTAMP'
    },
    // 1
    // @see packages/model/fixtures/Paper.js -> Fixture 2
    { 
        Paper_id: 2,
        Paper_title: 'Multiple Author, Single Version Paper',
        Paper_isDraft: true,
        Paper_showPreprint: false,
        Paper_score: 2,
        Paper_createdDate: 'TIMESTAMP',
        Paper_updatedDate: 'TIMESTAMP'
    },
    // 2
    // @see packages/model/fixtures/Paper.js -> Fixture 3
    { 
        Paper_id: 3,
        Paper_title: 'Single Author, Multiple Version Paper',
        Paper_isDraft: false,
        Paper_showPreprint: true,
        Paper_score: 3,
        Paper_createdDate: 'TIMESTAMP',
        Paper_updatedDate: 'TIMESTAMP'
    },
    // 3
    // @see packages/model/fixtures/Paper.js -> Fixture 4
    { 
        Paper_id: 4,
        Paper_title: 'Multiple Author, Multiple Version Paper',
        Paper_isDraft: false,
        Paper_showPreprint: false,
        Paper_score: 4,
        Paper_createdDate: 'TIMESTAMP',
        Paper_updatedDate: 'TIMESTAMP'
    }
]

export const result: QueryResult = {
    command: 'SELECT',
    rowCount: papers.length,
    oid: 1,
    fields: [],
    rows: [
        // Fixture 1: Single Author, Single Version Paper
        // @see packages/model/fixtures/Paper.js
        { ...papers[0], ...paper_authors[0], ...paper_versions[0], ...files[0], PaperField_fieldId: 1  },
        // Fixture 2: Multiple Author, Single Version Paper
        // @see packages/model/fixtures/Paper.js
        { ...papers[1], ...paper_authors[1], ...paper_versions[1], ...files[1], PaperField_fieldId: 1 },
        { ...papers[1], ...paper_authors[2], ...paper_versions[1], ...files[1], PaperField_fieldId: 1 },
        // Fixture 3: Single Author, Multiple Version Paper
        // @see packages/model/fixtures/Paper.js
        { ...papers[2], ...paper_authors[3], ...paper_versions[2], ...files[2], PaperField_fieldId: 1 },
        { ...papers[2], ...paper_authors[3], ...paper_versions[3], ...files[3], PaperField_fieldId: 1 },
        // Fixture 4: Multiple Author, Multiple Version Paper
        // @see packages/model/fixtures/Paper.js
        { ...papers[3], ...paper_authors[4], ...paper_versions[4], ...files[4], PaperField_fieldId: 1 },
        { ...papers[3], ...paper_authors[5], ...paper_versions[4], ...files[4], PaperField_fieldId: 1 },
        { ...papers[3], ...paper_authors[4], ...paper_versions[5], ...files[5], PaperField_fieldId: 1 },
        { ...papers[3], ...paper_authors[5], ...paper_versions[5], ...files[5], PaperField_fieldId: 1 }
    ]
}
