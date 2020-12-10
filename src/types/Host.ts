export default interface Host {
    id?: string
    name: string
    data: JSON
    deleted?: boolean
    createdTime: Date
    modifiedTime?: Date
    deletedTime?: Date
}

export interface HostDto {
    id?: string
    name: string
    data: JSON
}
