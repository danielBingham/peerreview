/******************************************************************************
 * Database fixtures.
 *
 * These are mock database row results.  They can be returned from  mock of
 * `database.query` in the DAO to test the DAO's hydration methods, or to mock
 * the DAO's `selectResource` method.
 *
 ******************************************************************************/

const paper_authors = [
    // 0
    // @see packages/model/fixtures/Paper.js -> Fixture 1, author 1 
    {
        PaperAuthor_userId: 1,
        PaperAuthor_order: 1,
        PaperAuthor_owner: true,
        PaperAuthor_submitter: true
    },
    // 1
    // @see packages/model/fixtures/Paper.js -> Fixture 2, author 1 
    {
        PaperAuthor_userId: 2,
        PaperAuthor_order: 1,
        PaperAuthor_owner: true,
        PaperAuthor_submitter: true
    },
    // 2
    // @see packages/model/fixtures/Paper.js -> Fixture 2, author 2 
    {
        PaperAuthor_userId: 3,
        PaperAuthor_order: 2,
        PaperAuthor_owner: false,
        PaperAuthor_submitter: false 
    },
    // 3
    // @see packages/model/fixtures/Paper.js -> Fixture 3, author 1 
    {
        PaperAuthor_userId: 4,
        PaperAuthor_order: 1,
        PaperAuthor_owner: true,
        PaperAuthor_submitter: true
    },
    // 4
    // @see packages/model/fixtures/Paper.js -> Fixture 4, author 1 
    {
        PaperAuthor_userId: 5,
        PaperAuthor_order: 1,
        PaperAuthor_owner: true,
        PaperAuthor_submitter: true
    },
    // 5
    // @see packages/model/fixtures/Paper.js -> Fixture 4, author 2 
    {
        PaperAuthor_userId: 6,
        PaperAuthor_order: 2,
        PaperAuthor_owner: false,
        PaperAuthor_submitter: false 
    }
]

const paper_versions = [
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

const files = [
    // 0
    // @see packages/model/fixtures/File.js -> Fixture 1
    {
        File_id: 1,
        File_userId: 1,
        File_location: 'https://s3.amazonaws.com',
        File_filepath: 'papers/1-1-single-author-single-version-paper.pdf',
        File_type: 'application/pdf',
        File_createdDate: 'TIMESTAMP',
        File_updatedDate: 'TIMESTAMP'
    },
    // 1
    // @see packages/model/fixtures/File.js -> Fixture 2
    {
        File_id: 2,
        File_userId: 2,
        File_location: 'https://s3.amazonaws.com',
        File_filepath: 'papers/2-1-multiple-author-single-version-paper.pdf',
        File_type: 'application/pdf',
        File_createdDate: 'TIMESTAMP',
        File_updatedDate: 'TIMESTAMP'

    },
    // 2
    // @see packages/model/fixtures/File.js -> Fixture 3
    {
        File_id: 3,
        File_userId: 4,
        File_location: 'https://s3.amazonaws.com',
        File_filepath: 'papers/3-1-single-author-multiple-version-paper.pdf',
        File_type: 'application/pdf',
        File_createdDate: 'TIMESTAMP',
        File_updatedDate: 'TIMESTAMP'
    },
    // 3
    // @see packages/model/fixtures/File.js -> Fixture 4
    {
        File_id: 4,
        File_userId: 4,
        File_location: 'https://s3.amazonaws.com',
        File_filepath: 'papers/3-2-single-author-multiple-version-paper.pdf',
        File_type: 'application/pdf',
        File_createdDate: 'TIMESTAMP',
        File_updatedDate: 'TIMESTAMP'
    },
    // 4
    // @see packages/model/fixtures/File.js -> Fixture 5
    {
        File_id: 5,
        File_userId: 5,
        File_location: 'https://s3.amazonaws.com',
        File_filepath: 'papers/4-1-multiple-author-multiple-version-paper.pdf',
        File_type: 'application/pdf',
        File_createdDate: 'TIMESTAMP',
        File_updatedDate: 'TIMESTAMP'
    },
    // 5
    // @see packages/model/fixtures/File.js -> Fixture 6
    {
        File_id: 6,
        File_userId: 5,
        File_location: 'https://s3.amazonaws.com',
        File_filepath: 'papers/4-2-multiple-author-multiple-version-paper.pdf',
        File_type: 'application/pdf',
        File_createdDate: 'TIMESTAMP',
        File_updatedDate: 'TIMESTAMP'
    }
]


const fields = [
    {
        field_id: 1,
        field_name: 'biology',
        field_type: 'biology',
        field_depth: 1,
        field_description: 'Study of life.',
        field_averageReputation: 50,
        field_createdDate: 'TIMESTAMP',
        field_updatedDate: 'TIMESTAMP'
    },
    {
        field_id: 2,
        field_name: 'genetics',
        field_type: 'biology',
        field_depth: 2,
        field_description: 'Study of genes and DNA.',
        field_averageReputation: 50,
        field_createdDate: 'TIMESTAMP',
        field_updatedDate: 'TIMESTAMP'
    }
]

const papers = [
    // 0
    // @see packages/model/fixtures/Paper.js -> Fixture 1
    { 
        Paper_id: 1,
        Paper_title: 'Single Author, Single Version Paper',
        Paper_isDraft: true,
        Paper_showPreprint: true,
        Paper_score: 0,
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
        Paper_title: 'Mulitple Author, Multiple Version Paper',
        Paper_isDraft: false,
        Paper_showPreprint: false,
        Paper_score: 4,
        Paper_createdDate: 'TIMESTAMP',
        Paper_updatedDate: 'TIMESTAMP'
    }
]

const paper_comments = [
    { 
        comment_id: 1,
        comment_paperId: 1,
        comment_userId: 1,
        comment_status: 'committed',
        comment_content: 'This is comment text.',
        comment_createdDate: 'TIMESTAMP',
        comment_updatedDate: 'TIMESTAMP',
        comment_committedDate: 'TIMESTAMP'
    },
    {
        comment_id: 2,
        comment_paperId: 1,
        comment_userId: 2,
        comment_status: 'committed',
        comment_content: 'This is more comment text.',
        comment_createdDate: 'TIMESTAMP',
        comment_updatedDate: 'TIMESTAMP',
        comment_committedDate: 'TIMESTAMP'
    },
    {
        comment_id: 3,
        comment_paperId: 1,
        comment_userId: 1,
        comment_status: 'in-progress',
        comment_content: 'This is further comment text.',
        comment_createdDate: 'TIMESTAMP',
        comment_updatedDate: 'TIMESTAMP',
        comment_committedDate: 'TIMESTAMP'
    }
]

const users = [
    {
        user_id: 1,
        user_orcidId: null,
        user_name: 'James Watson',
        user_email: 'jwatson@university.edu',
        user_status: 'confirmed',
        user_permissions: 'user',
        user_bio: 'Credited for discovering the structure of DNA.',
        user_location: 'Cambridge, UK',
        user_institution: 'University of Cambridge',
        user_reputation: 10,
        user_createdDate: 'TIMESTAMP',
        user_updatedDate: 'TIMESTAMP'
    },
    {
        user_id: 2,
        user_orcidId: null,
        user_name: 'Francis Crick',
        user_email: 'fcrick@university.edu',
        user_status: 'confirmed',
        user_permissions: 'user',
        user_bio: 'Credited for discovering the structure of DNA.',
        user_location: 'Cambridge, UK',
        user_institution: 'University of Cambridge',
        user_reputation: 10,
        user_createdDate: 'TIMESTAMP',
        user_updatedDate: 'TIMESTAMP',
    },
    {
        user_id: 3,
        user_orcidId: null,
        user_name: 'Rosalind Franklin',
        user_email: 'rfranklin@university.edu',
        user_status: 'confirmed',
        user_permissions: 'user',
        user_bio: 'Should probably have been given more credit for the discovery of the structure of DNA.',
        user_location: '',
        user_institution: '',
        user_reputation: 10,
        user_createdDate: 'TIMESTAMP',
        user_updatedDate: 'TIMESTAMP'
    }
]

const user_field_reputation = [
    {
        field_reputation: 10
    }
]

const journals = [
    {
        journal_id: 1,
        journal_name: 'Journal One', 
        journal_description: 'A first test journal.',
        journal_createdDate: 'TIMESTAMP',
        journal_updatedDate: 'TIMESTAMP'
    },
    {
        journal_id: 2,
        journal_name: 'Journal Two', 
        journal_description: 'A second test journal.',
        journal_createdDate: 'TIMESTAMP',
        journal_updatedDate: 'TIMESTAMP'

    },
    {
        journal_id: 3,
        journal_name: 'Journal Three',
        journal_description: 'A third test journal.',
        journal_createdDate: 'TIMESTAMP',
        journal_updatedDate: 'TIMESTAMP'
    },
    {
        journal_id: 4,
        journal_name: 'Journal Four',
        journal_description: 'A fourth test journal.',
        journal_createdDate: 'TIMESTAMP',
        journal_updatedDate: 'TIMESTAMP'
    }

]

const journal_members = [
    // Journal(1)
    {
        member_userId: 1,
        member_permissions: 'owner',
        member_order: 1,
        member_journalId: 1

    },
    {
        member_userId: 2,
        member_permissions: 'editor',
        member_order: 2,
        member_journalId: 1
    },
    {
        member_userId: 3,
        member_permissions: 'reviewer',
        member_order: 3,
        member_journalId: 1
    },

    // Journal(2)
    {
        member_userId: 2,
        member_permissions: 'owner',
        member_order: 1,
        member_journalId: 2
    },
    {
        member_userId: 1,
        member_permissions: 'editor',
        member_order: 2,
        member_journalId: 2
    },
    {
        member_userId: 3,
        member_permissions: 'reviewer',
        member_order: 3,
        member_journalId: 2
    },

    // Journal(3)
    {
        member_userId: 1,
        member_permissions: 'owner',
        member_order: 1,
        member_journalId: 3

    },
    {
        member_userId: 3,
        member_permissions: 'reviewer',
        member_order: 2,
        member_journalId: 3
    },
    
    // Journal(4)
    {
        member_userId: 4,
        member_permissions: 'owner',
        member_order: 1,
        member_journalId: 4
    },
    {
        member_userId: 5,
        member_permissions: 'editor',
        member_order: 2,
        member_journalId: 4
    },
    {
        member_userId: 6,
        member_permissions: 'reviewer',
        member_order: 3,
        member_journalId: 4
    }

]

const journal_submissions = [
    {
        submission_id: 1,
        submission_journalId: 1,
        submission_paperId: 1,
        submission_status: 'submitted',
        submission_submitterId: 1,
        submission_submitterComment: '',
        submission_deciderId: 2,
        submission_decisionComment: '',
        submission_decisionDate: 'TIMESTAMP',
        submission_createdDate: 'TIMESTAMP',
        submission_updatedDate: 'TIMESTAMP'
    },
    {
        submission_id: 2,
        submission_journalId: 2,
        submission_paperId: 2,
        submission_status: 'in-review',
        submission_submitterId: 2,
        submission_submitterComment: '',
        submission_deciderId: 3,
        submission_decisionComment: '',
        submission_decisionDate: 'TIMESTAMP',
        submission_createdDate: 'TIMESTAMP',
        submission_updatedDate: 'TIMESTAMP'
    }
]

const journal_submission_reviewers = [
    {
        reviewer_userId: null,
        reviewer_assignedDate: null
    },
    {
        reviewer_userId: 1,
        reviewer_assignedDate: 'TIMESTAMP'
    },
    {
        reviewer_userId: 2,
        reviewer_assignedDate: 'TIMESTAMP'
    }
]

const journal_submission_editors = [
    {
        editor_userId: null,
        editor_assignedDate: null
    },
    {
        editor_userId: 1,
        editor_assignedDate: 'TIMESTAMP'
    },
    {
        editor_userId: 2,
        editor_assignedDate: 'TIMESTAMP'
    }
]


const database = { 
    papers: {
        // Fixture 1: Single Author, Single Version Paper
        // @see packages/model/fixtures/Paper.js
        1: [
            { ...papers[0], ...paper_authors[0], ...paper_versions[0], ...files[0], PaperField_fieldId: 1  },
        ],
        // Fixture 2: Multiple Author, Single Version Paper
        // @see packages/model/fixtures/Paper.js
        2: [
            { ...papers[1], ...paper_authors[1], ...paper_versions[1], ...files[1], PaperField_fieldId: 1 },
            { ...papers[1], ...paper_authors[2], ...paper_versions[1], ...files[1], PaperField_fieldId: 1 },
        ],
        // Fixture 3: Single Author, Multiple Version Paper
        // @see packages/model/fixtures/Paper.js
        3: [ 
            { ...papers[2], ...paper_authors[3], ...paper_versions[2], ...files[2], PaperField_fieldId: 1 },
            { ...papers[2], ...paper_authors[3], ...paper_versions[3], ...files[3], PaperField_fieldId: 1 },
        ],
        // Fixture 4: Multiple Author, Multiple Version Paper
        // @see packages/model/fixtures/Paper.js
        4: [ 
            { ...papers[3], ...paper_authors[4], ...paper_versions[4], ...files[4], PaperField_fieldId: 1 },
            { ...papers[3], ...paper_authors[5], ...paper_versions[4], ...files[4], PaperField_fieldId: 1 },

            { ...papers[3], ...paper_authors[4], ...paper_versions[5], ...files[5], PaperField_fieldId: 1 },
            { ...papers[3], ...paper_authors[5], ...paper_versions[5], ...files[5], PaperField_fieldId: 1 },
        ],
    },
    paperComments: {
        1: [{ ...paper_comments[0] }],
        2: [{ ...paper_comments[1] }],
        3: [{ ...paper_comments[2] }]
    },
    journals: {
        1: [
            { ...journals[0], ...journal_members[0] },
            { ...journals[0], ...journal_members[1] },
            { ...journals[0], ...journal_members[2] }
        ],
        2: [
            { ...journals[1], ...journal_members[3] },
            { ...journals[1], ...journal_members[4] },
            { ...journals[1], ...journal_members[5] }
        ],
        3: [
            { ...journals[2], ...journal_members[6] },
            { ...journals[2], ...journal_members[7] }
        ],
        4: [
            { ...journals[3], ...journal_members[8] },
            { ...journals[3], ...journal_members[9] },
            { ...journals[3], ...journal_members[10] }
        ]
    },
    journalSubmissions: {
        1: [
            { ...journal_submissions[0], ...journal_submission_reviewers[0], ...journal_submission_editors[0] },
        ],
        2: [
            { ...journal_submissions[1], ...journal_submission_reviewers[1], ...journal_submission_editors[1] },
            { ...journal_submissions[1], ...journal_submission_reviewers[2], ...journal_submission_editors[2] }
        ]
    },
    users: {
        1: [
            { ...users[0], ...user_field_reputation[0], ...fields[0] },
            { ...users[0], ...user_field_reputation[0], ...fields[1] }
        ],
        2: [
            { ...users[1], ...user_field_reputation[0], ...fields[0] },
            { ...users[1], ...user_field_reputation[0], ...fields[1] }
        ],
        3: [
            { ...users[2], ...user_field_reputation[0], ...fields[0] },
            { ...users[2], ...user_field_reputation[0], ...fields[1] }
        ]
    },
    files: {
        1: [{ ...files[0] }],
        2: [{ ...files[1] }]
    }
}

module.exports = {
    database: database
}


