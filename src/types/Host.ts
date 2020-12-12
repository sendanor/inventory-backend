export default interface Host {
    id?: string
    name: string
    data: any
    deleted?: boolean
    createdTime: Date
    modifiedTime?: Date
    deletedTime?: Date
}

export interface HostDto {
    id?: string
    name: string
    data: any
}
