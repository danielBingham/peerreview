import { Model, ModelDictionary } from '../types/Model'
import { ResultType, EntityResult, QueryResult, } from "../types/Query"
export { ResultType } from '../types/Query'

/**
 * A helper function used to generate fixtures for tests.  Constructs the
 * appropriate result set based on the passed result type and an optional
 * filter function which is passed directly to `Array.prototype.filter` run
 * against the fixture array.
 *
 * @param {Type[]} fixtures     An array of fixtures that extend `Model`.
 * @param {ResultType} resultType   The type of result set we want returned (DatabaseResult, EntityResult, or QueryResult). 
 * @param {Function} filter     (Optional) An optional filter function passed to `fixtures.filter()`.
 *
 * @return {DatabaseResult<type> | EntityResult<Type> | QueryResult<Type>}  The
 * requested result type populated with the fixtures selected by the filter
 * function, or all the fixtures if no filter function is provided.
 */
export function generateFixture<Type extends Model>(
    fixtures: Type[], 
    resultType: ResultType, 
    filter?: (element: any, index: any, array: any[]) => boolean
): EntityResult<Type> | QueryResult<Type> {

    let fixtureList: Type[] = structuredClone(fixtures)
    if ( filter ) {
        fixtureList = fixtureList.filter(filter)
    }

    const fixtureDictionary: ModelDictionary<Type> = {}
    for(const feature of fixtureList) {
        fixtureDictionary[feature.id] = feature
    }

    if ( resultType == ResultType.Entity) {
        return {
            entity: fixtureList[0],
            relations: {}
        }
    } else if ( resultType == ResultType.Query) {
        return {
            dictionary: fixtureDictionary,
            list: fixtureList.map((f) => f.id),
            meta: {
                count: fixtureList.length,
                page: 1,
                pageSize: 20,
                numberOfPages: Math.floor(fixtureList.length / 20) + (fixtureList.length % 20 ? 1 : 0)
            },
            relations: {}
        }
    } else {
        throw new TypeError(`${resultType} is not a valid result type.`)
    }
}
