/******************************************************************************
 * Fixtures for the `fields` database table for use in tests.
 *
 * Represents the rows returned by the `SELECT` statement used in the
 * `FieldDAO`.
 *
 * @see `fields` table in `database/initialization-scripts/schema.sql`
 *
 ******************************************************************************/

import { getTableFixture } from './getTableFixture'

export const fields = [
    // 0 
    // @see packages/model/src/fixtures/Field.ts -> Fixture 1
    {
        Field_id: 1,
        Field_name: 'biology',
        Field_type: 'biology',
        Field_depth: 1,
        Field_description: 'Study of life.',
        Field_averageReputation: 0,
        Field_createdDate: 'TIMESTAMP',
        Field_updatedDate: 'TIMESTAMP'
    },
    // 1 
    // @see packages/model/src/fixtures/Field.ts -> Fixture 2
    {
        Field_id: 2,
        Field_name: 'genetics',
        Field_type: 'biology',
        Field_depth: 2,
        Field_description: 'Study of genes and DNA.',
        Field_averageReputation: 0,
        Field_createdDate: 'TIMESTAMP',
        Field_updatedDate: 'TIMESTAMP'
    }
]

export function getFieldsTableFixture(
    filter?: (element: any, index:any, array: any[]) => boolean
) {
    return getTableFixture(fields, filter)
}
