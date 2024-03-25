import { Model } from './Model'

/**
 * An individual field for use with the taxonomy. The taxonomy is heirarchical,
 * currently six layers deep.  At the top are the major academic disciplines
 * (physics, chemistry, biology, art, history, etc).  In the middle you get
 * subdiscplines, gradually giving way to topics, and at the bottom you get
 * invididual keywords (cell lines, specific artists, etc).
 */
export interface Field extends Model{

    /** Database id number for this field. **/
    id: number

    /** The name of this field. String with a-z0-9 and '-' allowed. eg. `physics` */
    name: string

    /** The name of the top level parent / parents.  Used to give the field its color. **/
    type: string

    /** The depth in the heirarchy this field exists at. **/
    depth: number

    /** DEPRECATED This was the average reputation gained be paper in this field. **/
    averageReputation: number

    /** A text description of this field. **/
    description: string

    /** A timestamp marking when this field was created. **/
    createdDate: string

    /** A timestamp marking when this field was most recently updated. **/
    updatedDate: string
}
