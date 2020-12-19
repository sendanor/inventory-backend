// Copyright (c) 2020 Sendanor. All rights reserved.

import { HostRepository } from "../types/HostRepository"
import Mapper from "../types/HostMapper"
import Host, { HostDto } from '../types/Host'
import HostUtils from "./HostUtils"
import { merge } from "../modules/lodash";
import { SaveResult, SaveStatus } from '../types/SaveResult'
import PageDto from '../types/PageDto'

export default class HostManager {

    private repository: HostRepository

    constructor(repository: HostRepository) {
        this.repository = repository
    }

    public findById(domainId: string, id: string): Promise<HostDto | undefined> {
        return new Promise((resolve, reject) =>
            this.repository.findById(domainId, id)
                .then(host => resolve(host ? Mapper.toDto(host) : undefined))
                .catch(err => reject(err)))
    }

    public findByName(domainId: string, name: string): Promise<HostDto | undefined> {
        return new Promise((resolve, reject) =>
            this.repository.findByName(domainId, name)
                .then(host => resolve(host ? Mapper.toDto(host) : undefined))
                .catch(err => reject(err)))
    }

    public getPage(domainId: string, page: number, size: number): Promise<PageDto<HostDto>> {
        const hostsPromise = this.repository.getPage(domainId, page, size)
        const countPromise = this.repository.getCount(domainId)
        return Promise.all([hostsPromise, countPromise])
            .then(values => {
                const hosts = (values[0] as Host[]).map(h => Mapper.toDto(h))
                const pageNumber = page
                const pageSize = size
                const totalCount = values[1] as number
                const pageCount = Math.ceil(totalCount / size)
                return { entities: hosts, pageNumber, pageSize, totalCount, pageCount }
            })
    }

    public create(dto: HostDto): Promise<SaveResult<Host>> {
        const host: Host = { ...dto, createdTime: new Date() }
        return new Promise((resolve, reject) =>
            this.validateName(host)
                .then(valid => valid ?
                    this.repository.create(host).then(entity => resolve({ entity, status: SaveStatus.Created })) :
                    resolve({ status: SaveStatus.NameConflict }))
                .catch(err => reject(err)))
    }

    public saveById(dto: HostDto): Promise<SaveResult<Host>> {
        const host: HostDto = { ...dto }
        const id = host.id!
        return new Promise((resolve, reject) =>
            this.repository.findById(host.domainId, id, true).then(current => {
                if (!current) {
                    return resolve(this.create(host))
                }
                if (!current.deleted && HostUtils.areEqualHostDtos(Mapper.toDto(current), host)) {
                    return resolve({ entity: current, status: SaveStatus.NotChanged })
                }
                return this.validateName(host).then(valid => {
                    if (!valid) {
                        return resolve({ status: SaveStatus.NameConflict })
                    }
                    const status = current.deleted ? SaveStatus.Created : SaveStatus.Updated
                    return this.repository.update(Mapper.toUpdatedHost(host, current))
                        .then(entity => resolve({ status, entity }))
                })
            }).catch(err => reject(err)))
    }

    public mergeById(id: string, dto: HostDto): Promise<SaveResult<Host>> {
        const host: HostDto = { ...dto, id }
        return this.repository.findById(host.domainId, id, true)
            .then(current => this.merge(host, current))
    }

    public mergeByName(name: string, dto: HostDto): Promise<SaveResult<Host>> {
        const host: HostDto = { ...dto }
        return this.repository.findByName(host.domainId, name, true)
            .then(current => this.merge(host, current))
    }

    public deleteById(domainId: string, id: string): Promise<boolean> {
        return new Promise((resolve, reject) =>
            this.repository.delete(domainId, id)
                .then(found => resolve(found))
                .catch(err => reject(err)))
    }

    public deleteByName(domainId: string, name: string): Promise<boolean> {
        return new Promise((resolve, reject) =>
            this.findByName(domainId, name)
                .then(host => host ? this.repository.delete(domainId, host.id!) : false)
                .then(found => resolve(found))
                .catch(err => reject(err)))
    }

    private merge(dto: HostDto, current?: Host): Promise<SaveResult<Host>> {
        if (!current) {
            return this.create(dto)
        }
        const merged = { ...dto, id: current.id, data: merge({}, current.data, dto.data) }
        if (!current.deleted && HostUtils.areEqualHostDtos(Mapper.toDto(current), merged)) {
            return Promise.resolve({ entity: current, status: SaveStatus.NotChanged })
        }
        return this.validateName(merged).then(valid => {
            if (!valid) {
                return Promise.resolve({ status: SaveStatus.NameConflict } as SaveResult<Host>)
            }
            if (current.deleted) {
                return this.repository.update(Mapper.toUpdatedHost({ ...dto }, current))
                    .then(entity => Promise.resolve({ entity, status: SaveStatus.Created }))
                    .catch(err => Promise.reject(err))
            }
            return this.repository.update(Mapper.toUpdatedHost(merged, current))
                .then(entity => Promise.resolve({ entity, status: SaveStatus.Updated }))
                .catch(err => Promise.reject(err))
        })
    }

    private validateName(host: HostDto): Promise<boolean> {
        const { id, domainId, name } = host
        return new Promise((resolve, reject) =>
            this.repository.findByName(domainId, name, true)
                .then(host => resolve(!host || host.id === id))
                .catch(err => reject(err)))
    }
}