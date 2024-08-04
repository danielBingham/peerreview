/******************************************************************************
 *
 *  JournalHub -- Universal Scholarly Publishing 
 *  Copyright (C) 2022 - 2024 Daniel Bingham 
 *
 *  This program is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as published
 *  by the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public License
 *  along with this program.  If not, see <https://www.gnu.org/licenses/>.
 *
 ******************************************************************************/
import { generateFixture, generateEntityFixture, generateQueryFixture } from './generateFixture'
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

export function getFileFixture(filter?: (element: any, index: any, array: any[]) => boolean) {
    return generateFixture<File>(files, filter)
}

export function getFileEntityFixture(filter?: (element: any, index: any, array: any[]) => boolean) {
    return generateEntityFixture<File>(files, filter)
}

export function getFileQueryFixture(filter?: (element: any, index: any, array: any[]) => boolean) {
    return generateQueryFixture<File>(files, filter)
}

