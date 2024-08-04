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
import { ModelDictionary } from '../types/Model'
import { EntityResult, QueryResult } from '../types/Query'

import { generateFixture, generateEntityFixture, generateQueryFixture } from './generateFixture'
import { Field } from "../types/Field"

export const fields: Field[] = [ 
    // Fixture 1 - top level field 
    // @see packages/backend/test/fixtures/database/FieldsTable.js -> fields[0]
    {
        id: 1,
        name: 'biology',
        type: 'biology',
        depth: 1,
        averageReputation: 0,
        description: 'Study of life.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // Fixture 2 - top level field 
    // @see packages/backend/test/fixtures/database/FieldsTable.js -> fields[0]
    {
        id: 2,
        name: 'genetics',
        type: 'biology',
        depth: 2,
        averageReputation: 0,
        description: 'Study of genes and DNA.',
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
]

export function getFieldFixture(filter?: (element: any, index: any, array: any[]) => boolean): { dictionary: ModelDictionary<Field>, list: Field[] } {
    return generateFixture<Field>(fields, filter)
}

export function getFieldEntityFixture(filter?: (element: any, index: any, array: any[]) => boolean): EntityResult<Field> {
    return generateEntityFixture<Field>(fields, filter)
}

export function getFieldQueryFixture(filter?: (element: any, index: any, array: any[]) => boolean): QueryResult<Field> {
    return generateQueryFixture<Field>(fields, filter)
}
