import { generateFixture, ResultType } from './generateFixture'
import { File } from "../types/File"

const files: File[] = [
    // Fixture 1: File for Single Author, Single Version Paper
    // @see packages/backend/test/fixtures/database.js -> files[0]
    {
        id: 1,
        userId: 1,
        location: 'https://s3.amazonaws.com/',
        filepath: 'papers/1-1-single-author-single-version-paper.pdf',
        type: 'application/pdf',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 2:  File for Multiple Author, Single Version Paper
    // @see packages/backend/test/fixtures/database.js -> files[1]
    { 
        id: 2,
        userId: 2,
        location: 'https://s3.amazonaws.com/',
        filepath: 'papers/2-1-multiple-author-single-version-paper.pdf',
        type: 'application/pdf',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 3:  File for Single Author, Multiple Version Paper
    // @see packages/backend/test/fixtures/database.js -> files[2]
    {
        id: 3,
        userId: 4,
        location: 'https://s3.amazonaws.com/',
        filepath: 'papers/3-1-single-author-multiple-version-paper.pdf',
        type: 'application/pdf',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 4:  File for Second Version of Single Author, Multiple Version Paper
    // @see packages/backend/test/fixtures/database.js -> files[3]
    {
        id: 4,
        userId: 4,
        location: 'https://s3.amazonaws.com/',
        filepath: 'papers/3-2-single-author-multiple-version-paper.pdf',
        type: 'application/pdf',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 5:  File for Multiple Author, Multiple Version Paper
    // @see packages/backend/test/fixtures/database.js -> files[4]
    {
        id: 5,
        userId: 5,
        location: 'https://s3.amazonaws.com/',
        filepath: 'papers/4-1-multiple-author-multiple-version-paper.pdf',
        type: 'application/pdf',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    },
    // Fixture 6:  File for Second Version of Multiple Author, Multiple Version Paper
    // @see packages/backend/test/fixtures/database.js -> files[5]
    {
        id: 6,
        userId: 5,
        location: 'https://s3.amazonaws.com/',
        filepath: 'papers/4-2-multiple-author-multiple-version-paper.pdf',
        type: 'application/pdf',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP',
    }
]

export function getFileFixture(resultType: ResultType, filter?: (element: any, index: any, array: any[]) => boolean) {
    return generateFixture(files, resultType, filter)
}