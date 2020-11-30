export interface HostPage {
    hosts: Host[]
    totalCount: number
    pageCount: number
}

export default interface Host {
    id?: string
    name: string
    data: JSON
}

export interface HostSaveResult {
    host?: Host
    changed: boolean
    nameConflict?: boolean
}