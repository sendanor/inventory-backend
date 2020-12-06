/**
 * One page of hosts.
 */
export interface HostPage {
    /**
     * Hosts of the page.
     */
    hosts: Host[]

    /**
     * Total number of hosts.
     */
    totalCount: number

    /**
     * Total number of host pages when page size of the request is used.
     */
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

/**
 * Information about attempted host save.
 */
export interface HostSaveResult {
    /**
     * Host, if save was succesful. Otherwise undefined.
     */
    host?: Host

    /**
     * Save status.
     */
    status: SaveStatus
}