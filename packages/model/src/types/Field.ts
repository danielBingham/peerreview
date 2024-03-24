import { Model } from './Model'


export interface Field extends Model{
    id: number
    name: string
    type: string
    depth: number
    averageReputation: number
    description: string
    createdDate: string
    updatedDate: string
}
