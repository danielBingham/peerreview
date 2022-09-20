// Tables

const paper_authors = [
    {
        author_id: 1,
        author_order: 1,
        author_owner: true
    },
    {
        author_id: 2,
        author_order: 2,
        author_owner: false,
    }
]

const paper_versions = [
    {     
        version_version: 1,
        version_createdDate: 'TIMESTAMP',
        version_updatedDate: 'TIMESTAMP'
    },
    {
        version_version: 2,
        version_createdDate: 'TIMESTAMP',
        version_updatedDate: 'TIMESTAMP',
    }
]

const filesBefore = [
    {
        file_id: 1,
        file_userId: 1,
        file_filepath: '/uploads/files/WatsonCrick1953.pdf',
        file_type: 'application/pdf',
        file_location: 'https://spaces-bucket-url.digitalocean.com',
        file_createdDate: 'TIMESTAMP',
        file_updatedDate: 'TIMESTAMP'
    },
    {
        file_id: 2,
        file_userId: 1,
        file_filepath: '/uploads/files/WatsonCrick-Annotated.pdf',
        file_type: 'application/pdf',
        file_location: 'https://spaces-bucket-url.digitalocean.com',
        file_createdDate: 'TIMESTAMP',
        file_updatedDate: 'TIMESTAMP'

    }
]

const files = [
    {
        file_id: 1,
        file_userId: 1,
        file_filepath: '/uploads/papers/1-1-molecular-structure-of-nucleic-acids.pdf',
        file_type: 'application/pdf',
        file_location: 'https://spaces-bucket-url.digitalocean.com',
        file_createdDate: 'TIMESTAMP',
        file_updatedDate: 'TIMESTAMP'
    },
    {
        file_id: 2,
        file_userId: 1,
        file_filepath: '/uploads/papers/1-2-molecular-structure-of-nucleic-acids.pdf',
        file_type: 'application/pdf',
        file_location: 'https://spaces-bucket-url.digitalocean.com',
        file_createdDate: 'TIMESTAMP',
        file_updatedDate: 'TIMESTAMP'

    }
]

const paper_votes = [
    {
        vote_paperId: 1,
        vote_userId: 3,
        vote_score: 1
    }
]


const fields = [
    {
        field_id: 1,
        field_name: 'biology',
        field_type: 'biology',
        field_description: 'Study of life.',
        field_averageReputation: 50,
        field_createdDate: 'TIMESTAMP',
        field_updatedDate: 'TIMESTAMP'
    },
    {
        field_id: 2,
        field_name: 'genetics',
        field_type: 'biology',
        field_description: 'Study of genes and DNA.',
        field_averageReputation: 50,
        field_createdDate: 'TIMESTAMP',
        field_updatedDate: 'TIMESTAMP'
    }
]

const papers = [
    { 
        paper_id: 1,
        paper_title: 'Molecular Structure of Nucleic Acids',
        paper_isDraft: false,
        paper_createdDate: 'TIMESTAMP',
        paper_updatedDate: 'TIMESTAMP',
    },
    { 
        paper_id: 2,
        paper_title: 'Molecular Structure of Nucleic Acids',
        paper_isDraft: true,
        paper_createdDate: 'TIMESTAMP',
        paper_updatedDate: 'TIMESTAMP',
    }
]

const users = [
    {
        user_id: 1,
        user_orcidId: null,
        user_name: 'James Watson',
        user_email: 'jwatson@university.edu',
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
        user_bio: 'Credited for discovering the structure of DNA.',
        user_location: 'Cambridge, UK',
        user_institution: 'University of Cambridge',
        user_reputation: 10,
        user_createdDate: 'TIMESTAMP',
        user_updatedDate: 'TIMESTAMP',
    }
]

const user_field_reputation = [
    {
        field_reputation: 10
    }
]


const database = { 
    papers: {
        1: [
            { ...papers[0], ...paper_authors[0], ...paper_versions[0], ...files[0], ...fields[0], ...paper_votes[0] },
            { ...papers[0], ...paper_authors[0], ...paper_versions[0], ...files[0], ...fields[1], ...paper_votes[0] },

            { ...papers[0], ...paper_authors[0], ...paper_versions[1], ...files[1], ...fields[0], ...paper_votes[0] },
            { ...papers[0], ...paper_authors[0], ...paper_versions[1], ...files[1], ...fields[1], ...paper_votes[0] },

             
            { ...papers[0], ...paper_authors[1], ...paper_versions[0], ...files[0], ...fields[0], ...paper_votes[0] },
            { ...papers[0], ...paper_authors[1], ...paper_versions[0], ...files[0], ...fields[1], ...paper_votes[0] },

            { ...papers[0], ...paper_authors[1], ...paper_versions[1], ...files[1], ...fields[0], ...paper_votes[0] },
            { ...papers[0], ...paper_authors[1], ...paper_versions[1], ...files[1], ...fields[1], ...paper_votes[0] },
        ],
        2: [
            { ...papers[1], ...paper_authors[0], ...paper_versions[0], ...files[0], ...fields[0]},
            { ...papers[1], ...paper_authors[0], ...paper_versions[0], ...files[0], ...fields[1]},

            { ...papers[1], ...paper_authors[0], ...paper_versions[1], ...files[1], ...fields[0]},
            { ...papers[1], ...paper_authors[0], ...paper_versions[1], ...files[1], ...fields[1]},

             
            { ...papers[1], ...paper_authors[1], ...paper_versions[0], ...files[0], ...fields[0]},
            { ...papers[1], ...paper_authors[1], ...paper_versions[0], ...files[0], ...fields[1]},

            { ...papers[1], ...paper_authors[1], ...paper_versions[1], ...files[1], ...fields[0]},
            { ...papers[1], ...paper_authors[1], ...paper_versions[1], ...files[1], ...fields[1]},
        ]

    } ,
    users: {
        1: [
            { ...users[0], ...user_field_reputation[0], ...fields[0] },
            { ...users[0], ...user_field_reputation[0], ...fields[1] }
        ],
        2: [
            { ...users[1], ...user_field_reputation[0], ...fields[0] },
            { ...users[1], ...user_field_reputation[0], ...fields[1] }
        ]
    },
    files: {
        1: [{ ...files[0] }],
        2: [{ ...files[1] }]
    },
    filesBefore: {
        1: [{ ...filesBefore[0] }],
        2: [{ ...filesBefore[1] }]
    }
}

module.exports = {
    database: database
}


