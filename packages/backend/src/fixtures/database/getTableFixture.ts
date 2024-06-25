
import { QueryResult } from 'pg'

/**
 * Get a table fixture, as result as it would be returned from `pg`'s
 * `Pool.query`.
 *
 * @param {any[]} fixtures  An array of rows to be returned in the QueryResult.
 * @param {Function} filter     (Optional) A filter function that will be
 * passed directly to `fixtures.filter()`.
 *
 * @return {QueryResult}    A QueryResult set as it would be returned from
 * `pg`'s `Pool.query()` populated with the rows selected by the filter
 * function, or all of the fixture rows.
 */
export function getTableFixture(
    fixtures: any[], 
    filter?: (element: any, index: any, array: any[]) => boolean
): QueryResult {

    let fixtureList = structuredClone(fixtures)
    if ( filter ) {
        fixtureList = fixtureList.filter(filter)
    }

    return {
        command: 'SELECT',
        rowCount: fixtureList.length,
        oid: 1,
        fields: [],
        rows: fixtureList
    }
}
  
