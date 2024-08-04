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
