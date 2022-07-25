const users = [
    {
        name: 'James Watson',
        email: 'jwatson@university.edu',
        institution: 'University of Cambridge',
        password: 'password'
    },
    {
        name: 'Francis Crick',
        email: 'fcrick@university.edu',
        institution: 'University of Cambridge',
        password: 'p4ssw0rd'
    }
]


const fields = [
    {
        id: 1,
        name: 'biology',
        description: 'Study of life.',
        type: 'biology',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    {
        id: 2,
        name: 'genetics',
        description: 'Study of genes and DNA.',
        type: 'biology',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    }
]


const paperUsers = [
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
                field: fields[0]
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


const papers = [
    {
        title: 'Molecular Structure of Nucleic Acids',
        isDraft: false,
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
        authors: [
            {
                user: paperUsers[0],
                order: 1,
                owner: true
            },
            {
                user: paperUsers[1],
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
                file: { 
                    id: 1,
                    filepath: '/WatsonCrick1953.pdf',
                    type: 'application/pdf'
                }
            },
            {
                version: 2,
                file: { 
                    id: 2,
                    filepath: '/WatsonCrick-Annotated.pdf',
                    type: 'application/pdf'
                }
            }
        ]
    }
]

module.exports = {
    fields: fields,
    users: users,
    papers: papers
}
