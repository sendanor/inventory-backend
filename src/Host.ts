export interface HostPage {
    hosts: Host[]
    totalCount: number
    pageCount: number
}

export default interface Host {
    id?: string
    name: string
    data: JSON
    deleted?: boolean
    createdTime?: string
    modifiedTime?: string
    deletedTime?: string
}

export enum SaveStatus {
    Created, Updated, Deleted, NotChanged, NameConflict,
}

export interface HostSaveResult {
    host?: Host
    status: SaveStatus
}