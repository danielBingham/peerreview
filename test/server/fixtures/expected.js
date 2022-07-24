
const fields = [
    {
        id: 1,
        name: 'biology',
        description: 'Study of life.',
        type: 'biology',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        children: [],
        parents: []

    },
    {
        id: 2,
        name: 'genetics',
        description: 'Study of genes and DNA.',
        type: 'biology',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        children: [],
        parents: []
    }

]

const users = [
    {
        id: 1,
        name: 'James Watson',
        email: 'jwatson@university.edu',
        bio: 'Credited for discovering the structure of DNA.',
        location: 'Cambridge, UK',
        institution: 'University of Cambridge',
        initialReputation: 100,
        reputation: 110,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        fields: [
            {
                reputation: 10,
                field: fields[0]
            }, 
            {
                reputation: 10,
                field: fields[1]
            }
        ]
    },
    {
        id: 2,
        name: 'Francis Crick',
        email: 'fcrick@university.edu',
        bio: 'Credited for discovering the structure of DNA.',
        location: 'Cambridge, UK',
        institution: 'University of Cambridge',
        initialReputation: 100,
        reputation: 110,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        fields: [
            {
                reputation: 10,
                field: fields[0] 
            }, 
            {
                reputation: 10,
                field: fields[1] 
            }
        ]
    }
]

const files = [
    { 
        id: 1,
        userId: 1,
        filepath: '/uploads/papers/1-1-molecular-structure-of-nucleic-acids.pdf',
        type: 'application/pdf',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    { 
        id: 2,
        userId: 1,
        filepath: '/uploads/papers/1-2-molecular-structure-of-nucleic-acids.pdf',
        type: 'application/pdf',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'

    }
]

const papers = [
    {
        id: 1,
        title: 'Molecular Structure of Nucleic Acids',
        isDraft: false,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        authors: [
            {
                user: users[0],
                order: 1,
                owner: true
            },
            {
                user: users[1],
                order: 2,
                owner: false 
            }
        ],
        fields: [
            fields[0],
            fields[1]
        ],
        versions: [
            {
                version: 1,
                file: files[0],
                createdDate: 'TIMESTAMP',
                updatedDate: 'TIMESTAMP'
            },
            {
                version: 2,
                file: files[1],
                createdDate: 'TIMESTAMP',
                updatedDate: 'TIMESTAMP'
            }
        ],
        votes: [
            {
                paperId: 1,
                userId: 3,
                score: 1
            }
        ]
    }
]

module.exports = {
    fields: fields,
    users: users,
    papers: papers
}
