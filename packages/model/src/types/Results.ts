import { Model } from "./Model"

export interface ModelDictionary<T extends Model> {
    [id: number|string]: T
}

export interface DatabaseResult<T extends Model> {
    dictionary: ModelDictionary<T>,
    list: T[],
}

export interface RestResult<T extends Model> {
    entity: T,
    relations: { [modelName: string]: ModelDictionary<Model> }
}

export interface PageMetadata {
    count: number,
    page: number,
    pageSize: number,
    numberOfPages: number
}

export interface QueryResult<T extends Model> {
    dictionary: ModelDictionary<T>,
    list: T[],
    meta: PageMetadata,
    relations: { [modelName: string]: ModelDictionary<Model> }
}
