import { HostRepository } from "../types/HostRepository"
import Mapper from "../types/HostMapper"
import Host, { HostDto } from '../types/Host'
import HostUtils from "./HostUtils"
import { merge } from "../modules/lodash";

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
        return new Promise((resolve, reject) => {
            this.repository.findById(id)
                .then(host => resolve(host ? Mapper.toDto(host) : undefined))
                .catch(err => reject(err))
        })
    }

    public findByName(name: string): Promise<HostDto | undefined> {
        return new Promise((resolve, reject) => {
            this.repository.findByName(name)
                .then(host => resolve(host ? Mapper.toDto(host) : undefined))
                .catch(err => reject(err))
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
                return this.repository.create(host).then(host => resolve({ host, status: SaveStatus.Created }))
            }).catch(err => reject(err))
        })
    }

    public saveById(dto: HostDto): Promise<HostSaveResult> {
        const host: HostDto = { ...dto }
        const id = host.id!
        return new Promise((resolve, reject) => {
            this.repository.findById(id, true).then(current => {
                if (!current) {
                    return resolve(this.create(host))
                }
                if (!current.deleted && HostUtils.areEqualHostDtos(Mapper.toDto(current), host)) {
                    return resolve({ status: SaveStatus.NotChanged })
                }
                return this.validateName(host.name, id).then(valid => {
                    if (!valid) {
                        return resolve({ status: SaveStatus.NameConflict })
                    }
                    const status = current.deleted ? SaveStatus.Created : SaveStatus.Updated
                    return this.repository.update(Mapper.toUpdatedHost(host, current))
                        .then(host => resolve({ status, host }))
                })
            }).catch(err => reject(err))
        })
    }

    public mergeByName(dto: HostDto): Promise<HostSaveResult> {
        const host: HostDto = { ...dto, id: undefined }
        return new Promise((resolve, reject) => {
            this.repository.findByName(host.name, true).then(current => {
                if (!current) {
                    return resolve(this.create(host))
                }
                const merged = { ...host, data: merge({}, current.data, host.data) }
                if (!current.deleted && HostUtils.areEqualHostDtos(Mapper.toDto(current), merged)) {
                    return resolve({ host: current, status: SaveStatus.NotChanged })
                }
                const status = current.deleted ? SaveStatus.Created : SaveStatus.Updated
                return this.repository.update(Mapper.toUpdatedHost(merged, current))
                    .then(host => resolve({ status, host }))
            }).catch(err => reject(err))
        })
    }

    public deleteById(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.repository.delete(id)
                .then(found => resolve(found))
                .catch(err => reject(err))
        })
    }

    public deleteByName(name: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.findByName(name)
                .then(host => host ? this.repository.delete(host.id!) : false)
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