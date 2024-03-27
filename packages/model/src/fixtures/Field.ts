import { generateFixture, ResultType } from './generateFixture'
import { Field, } from "../types/Field"

export const fields: Field[] = [ 
    // Fixture 1 - top level field 
    // @see packages/backend/test/fixtures/database/FieldsTable.js -> fields[0]
    {
        id: 1,
        name: 'biology',
        type: 'biology',
        depth: 1,
        averageReputation: 0,
        description: "The study of life.",
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
    // Fixture 2 - top level field 
    // @see packages/backend/test/fixtures/database/FieldsTable.js -> fields[0]
    {
        id: 2,
        name: 'physics',
        type: 'physics',
        depth: 1,
        averageReputation: 0,
        description: "The study of forces.",
        createdDate: 'TIMESTAMP',
        updatedDate: 'TIMESTAMP'
    },
]

export function getFieldFixture(resultType: ResultType, filter?: (element: any, index: any, array: any[]) => boolean) {
    return generateFixture(fields, resultType, filter)
}
