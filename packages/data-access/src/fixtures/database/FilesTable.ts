/******************************************************************************
 * Fixtures for the `files` database table for use in tests.
 *
 * Represents the rows returned by the `SELECT` statement used in the
 * `FileDAO`.
 *
 * @see `files` table in `database/initialization-scripts/schema.sql`
 *
 ******************************************************************************/

import { getTableFixture } from './getTableFixture'

export const files = [
    // 0
    // @see packages/model/fixtures/File.js -> Fixture 1
    {
        File_id: 1,
        File_userId: 1,
        File_location: 'https://s3.amazonaws.com/',
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
        File_location: 'https://s3.amazonaws.com/',
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
        File_location: 'https://s3.amazonaws.com/',
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
        File_location: 'https://s3.amazonaws.com/',
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
        File_location: 'https://s3.amazonaws.com/',
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
        File_location: 'https://s3.amazonaws.com/',
        File_filepath: 'papers/4-2-multiple-author-multiple-version-paper.pdf',
        File_type: 'application/pdf',
        File_createdDate: 'TIMESTAMP',
        File_updatedDate: 'TIMESTAMP'
    }
]

export function getFilesTableFixture(
    filter?: (element: any, index:any, array: any[]) => boolean
) {
    return getTableFixture(files, filter)
}
