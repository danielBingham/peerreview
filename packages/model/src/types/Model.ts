
/**
 * The base model interface that will be used for all of our model types.
 */
export interface Model {
    /** The database id of this Model in its associated database table. */
    id: number
}

/**
 * A dictionary we can use with our model types.
 */
export interface ModelDictionary<T extends Model> {
    [id: number]: T
}
