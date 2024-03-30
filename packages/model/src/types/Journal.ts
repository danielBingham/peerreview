import { Model } from './Model'

export enum JournalMemberPermissions {
    Owner = 'owner',
    Editor = 'editor',
    Reviewer = 'reviewer'
}

export interface JournalMember {
    journalId: number
    userId: number
    order: number
    permissions: JournalMemberPermissions,
    createdDate: string
    updatedDate: string
}

export enum JournalModel {
    Public = 'public',
    Open = 'open',
    Closed = 'closed'
}
export interface Journal extends Model {
    name: string
    description: string
    model?: JournalModel
    createdDate: string
    updatedDate: string
    members: JournalMember[]
}
