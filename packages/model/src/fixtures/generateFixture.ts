import { Model, ModelDictionary } from '../types/Model'
import { ResultType, EntityResult, QueryResult, } from "../types/Query"
export { ResultType } from '../types/Query'

/**
 * A helper function used to generate fixtures for tests.  Constructs the
 * appropriate result set based on the passed result type and an optional
 * filter function which is passed directly to `Array.prototype.filter` run
 * against the fixture array.
 */
export function generateFixture<Type extends Model>(
    fixtures: Type[],
    filter?: (element: any, index: any, array: any[]) => boolean
): { dictionary: ModelDictionary<Type>, list: Type[] } {

    let fixtureList: Type[] = structuredClone(fixtures)
    if ( filter ) {
        fixtureList = fixtureList.filter(filter)
    }

    const fixtureDictionary: ModelDictionary<Type> = {}
    for(const fixture of fixtureList) {
        fixtureDictionary[fixture.id] = fixture 
    }

    return {
        dictionary: fixtureDictionary,
        list: fixtureList
    }
}

export function generateEntityFixture<Type extends Model>(
    fixtures: Type[],
    filter?: (element: any, index: any, array: any[]) => boolean
): EntityResult<Type> {
    const { dictionary, list } = generateFixture<Type>(fixtures, filter)
    return {
        entity: list[0],
        relations: {}
    }
}

export function generateQueryFixture<Type extends Model>(
    fixtures: Type[],
    filter?: (element: any, index: any, array: any[]) => boolean
): QueryResult<Type> {
    const { dictionary, list } = generateFixture<Type>(fixtures, filter)
    return {
        dictionary: dictionary,
        list: list.map((f) => f.id),
        meta: {
            count: list.length,
            page: 1,
            pageSize: 20,
            numberOfPages: Math.floor(list.length / 20) + (list.length % 20 ? 1 : 0)
        },
        relations: {}
    }
}
