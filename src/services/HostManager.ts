import { HostRepository } from "../types/HostRepository"
import Mapper from "../types/HostMapper"
import Host, { HostDto } from '../types/Host'
import HostUtils from "./HostUtils"

interface HostPageDto {
    hosts: HostDto[]
    pageNumber: number
    pageSize: number
    pageCount: number
    totalCount: number
}

export enum SaveStatus {
    Created,
    Updated,
    Deleted,
    NotChanged,
    NameConflict,
}

export interface HostSaveResult {
    host?: Host
    status: SaveStatus
}

export default class HostManager {

    private repository: HostRepository

    constructor(repository: HostRepository) {
        this.repository = repository
    }

    public findById(id: string): Promise<HostDto | undefined> {
        return new Promise((resolve, _) => {
            this.repository.findById(id).then(host => resolve(host ? Mapper.toDto(host) : undefined))
        })
    }

    public findByName(name: string): Promise<HostDto | undefined> {
        return new Promise((resolve, reject) => {
            this.repository.findByName(name).then(host => resolve(host ? Mapper.toDto(host) : undefined))
        })
    }

    public getPage(page: number, size: number): Promise<HostPageDto> {
        const hostsPromise = this.repository.getPage(page, size)
        const countPromise = this.repository.getCount()
        return Promise.all([hostsPromise, countPromise])
            .then(values => {
                const hosts = (values[0] as Host[]).map(h => Mapper.toDto(h))
                const pageNumber = page
                const pageSize = size
                const totalCount = values[1] as number
                const pageCount = Math.ceil(totalCount / size)
                return { hosts, pageNumber, pageSize, totalCount, pageCount }
            })
    }

    public create(dto: HostDto): Promise<HostSaveResult> {
        const host: Host = { ...dto, createdTime: new Date() }
        return new Promise((resolve, reject) => {
            this.validateName(dto.name, dto.id).then(valid => {
                if (!valid) {
                    return resolve({ status: SaveStatus.NameConflict })
                }
                this.repository.create(host).then(host => resolve({ host, status: SaveStatus.Created }))
            }).catch(err => reject(err))
        })
    }

    public saveById(dto: HostDto): Promise<HostSaveResult> {
        const id = dto.id!
        return new Promise((resolve, reject) => {
            this.repository.findById(id, true).then(current => {
                if (!current) {
                    return resolve(this.create(dto))
                }
                if (!current.deleted && HostUtils.areEqualHostDtos(Mapper.toDto(current), dto)) {
                    return resolve({ status: SaveStatus.NotChanged })
                }
                this.validateName(dto.name, id).then(valid => {
                    if (!valid) {
                        return resolve({ status: SaveStatus.NameConflict })
                    }
                    const status = current.deleted ? SaveStatus.Created : SaveStatus.Updated
                    this.repository.update(Mapper.toUpdatedHost(dto, current))
                        .then(host => resolve({ status, host }))
                })
            }).catch(err => reject(err))
        })
    }

    public saveByName(dto: HostDto): Promise<HostSaveResult> {
        return new Promise((resolve, reject) => {
            this.repository.findByName(dto.name, true).then(current => {
                if (!current) {
                    return resolve(this.create(dto))
                }
                if (!current.deleted && HostUtils.areEqualHostDtos(Mapper.toDto(current), dto)) {
                    return resolve({ status: SaveStatus.NotChanged })
                }
                const status = current.deleted ? SaveStatus.Created : SaveStatus.Updated
                this.repository.update(Mapper.toUpdatedHost(dto, current))
                    .then(host => resolve({ status, host }))
            }).catch(err => reject(err))
        })
    }

    public delete(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.repository.delete(id)
                .then(found => resolve(found))
                .catch(err => reject(err))
        })
    }


    private validateName(name: string, id?: string): Promise<boolean> {
        return new Promise((resolve, _) => {
            this.repository.findByName(name, true).then(host => resolve(!host || host.id === id))
        })
    }
}