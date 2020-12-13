// Copyright (c) 2020 Sendanor. All rights reserved.

import { DomainRepository } from "../types/DomainRepository"
import Mapper from "../types/DomainMapper"
import Domain, { DomainDto } from '../types/Domain'
import DomainUtils from "./DomainUtils"
import { merge } from "../modules/lodash";
import { SaveResult, SaveStatus } from '../types/SaveResult'
import PageDto from '../types/PageDto'

export default class DomainManager {

    private repository: DomainRepository

    constructor(repository: DomainRepository) {
        this.repository = repository
    }

    public findById(id: string): Promise<DomainDto | undefined> {
        return new Promise((resolve, reject) => {
            this.repository.findById(id)
                .then(domain => resolve(domain ? Mapper.toDto(domain) : undefined))
                .catch(err => reject(err))
        })
    }

    public findByName(name: string): Promise<DomainDto | undefined> {
        return new Promise((resolve, reject) => {
            this.repository.findByName(name)
                .then(domain => resolve(domain ? Mapper.toDto(domain) : undefined))
                .catch(err => reject(err))
        })
    }

    public getPage(page: number, size: number): Promise<PageDto<DomainDto>> {
        const domainsPromise = this.repository.getPage(page, size)
        const countPromise = this.repository.getCount()
        return Promise.all([domainsPromise, countPromise])
            .then(values => {
                const domains = (values[0] as Domain[]).map(h => Mapper.toDto(h))
                const pageNumber = page
                const pageSize = size
                const totalCount = values[1] as number
                const pageCount = Math.ceil(totalCount / size)
                return { entities: domains, pageNumber, pageSize, totalCount, pageCount }
            })
    }

    public create(dto: DomainDto): Promise<SaveResult<Domain>> {
        const domain: Domain = { ...dto, createdTime: new Date() }
        return new Promise((resolve, reject) => {
            this.validateName(domain).then(valid => {
                if (!valid) {
                    return resolve({ status: SaveStatus.NameConflict })
                }
                return this.repository.create(domain).then(entity => resolve({ entity, status: SaveStatus.Created }))
            }).catch(err => reject(err))
        })
    }

    public saveById(dto: DomainDto): Promise<SaveResult<Domain>> {
        const domain: DomainDto = { ...dto }
        const id = domain.id!
        return new Promise((resolve, reject) => {
            this.repository.findById(id, true).then(current => {
                if (!current) {
                    return resolve(this.create(domain))
                }
                if (!current.deleted && DomainUtils.areEqualDomainDtos(Mapper.toDto(current), domain)) {
                    return resolve({ entity: current, status: SaveStatus.NotChanged })
                }
                return this.validateName(domain).then(valid => {
                    if (!valid) {
                        return resolve({ status: SaveStatus.NameConflict })
                    }
                    const status = current.deleted ? SaveStatus.Created : SaveStatus.Updated
                    return this.repository.update(Mapper.toUpdatedDomain(domain, current))
                        .then(entity => resolve({ status, entity }))
                })
            }).catch(err => reject(err))
        })
    }

    public mergeByName(dto: DomainDto): Promise<SaveResult<Domain>> {
        const domain: DomainDto = { ...dto, id: undefined }
        return new Promise((resolve, reject) => {
            this.repository.findByName(domain.name, true).then(current => {
                if (!current) {
                    return resolve(this.create(domain))
                }
                const merged = { ...domain, data: merge({}, current.data, domain.data) }
                if (!current.deleted && DomainUtils.areEqualDomainDtos(Mapper.toDto(current), merged)) {
                    return resolve({ entity: current, status: SaveStatus.NotChanged })
                }
                const status = current.deleted ? SaveStatus.Created : SaveStatus.Updated
                return this.repository.update(Mapper.toUpdatedDomain(merged, current))
                    .then(entity => resolve({ status, entity }))
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
                .then(domain => domain ? this.repository.delete(domain.id!) : false)
                .then(found => resolve(found))
                .catch(err => reject(err))
        })
    }

    private validateName(domain: DomainDto): Promise<boolean> {
        const { id, name } = domain
        return new Promise((resolve, _) => {
            this.repository.findByName(name, true).then(domain => resolve(!domain || domain.id === id))
        })
    }
}