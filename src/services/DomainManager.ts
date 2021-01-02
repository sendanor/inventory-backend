// Copyright (c) 2020 Sendanor. All rights reserved.

import { DomainRepository } from "../types/DomainRepository";
import Mapper from "../types/DomainMapper";
import Domain, { DomainDto } from "../types/Domain";
import DomainUtils from "./DomainUtils";
import { merge } from "../modules/lodash";
import { SaveResult, SaveStatus } from "../types/SaveResult";
import PageDto from "../types/PageDto";
import HostRepository from "../types/HostRepository";

export default class DomainManager {
    private repository: DomainRepository;
    hostRepository: HostRepository;

    constructor(repository: DomainRepository, hostRepository: HostRepository) {
        this.repository = repository;
        this.hostRepository = hostRepository;
    }

    public findById(id: string): Promise<DomainDto | undefined> {
        return new Promise((resolve, reject) =>
            this.repository
                .findById(id)
                .then((domain) => resolve(domain ? Mapper.toDto(domain) : undefined))
                .catch((err) => reject(err))
        );
    }

    public findByName(name: string): Promise<DomainDto | undefined> {
        return new Promise((resolve, reject) =>
            this.repository
                .findByName(name)
                .then((domain) => resolve(domain ? Mapper.toDto(domain) : undefined))
                .catch((err) => reject(err))
        );
    }

    public getPage(page: number, size: number, search?: string): Promise<PageDto<DomainDto>> {
        const domainsPromise = this.repository.getPage(page, size, search);
        const countPromise = this.repository.getCount(search);
        return Promise.all([domainsPromise, countPromise]).then((values) => {
            const domains = (values[0] as Domain[]).map((h) => Mapper.toDto(h));
            const pageNumber = page;
            const pageSize = size;
            const totalCount = values[1] as number;
            const pageCount = Math.ceil(totalCount / size);
            return { entities: domains, pageNumber, pageSize, totalCount, pageCount };
        });
    }

    public create(dto: DomainDto): Promise<SaveResult<DomainDto>> {
        const domain: Domain = { ...dto, createdTime: new Date() };
        return new Promise((resolve, reject) =>
            this.validateName(domain)
                .then((valid) =>
                    valid
                        ? this.repository
                              .create(domain)
                              .then((domain) => resolve({ dto: Mapper.toDto(domain), status: SaveStatus.Created }))
                        : resolve({ status: SaveStatus.NameConflict })
                )
                .catch((err) => reject(err))
        );
    }

    public saveById(dto: DomainDto): Promise<SaveResult<DomainDto>> {
        const domain: DomainDto = { ...dto };
        const id = domain.id!;
        return new Promise((resolve, reject) =>
            this.repository
                .findById(id, true)
                .then((current) => {
                    if (!current) {
                        return resolve(this.create(domain));
                    }
                    if (!current.deleted && DomainUtils.areEqualDomainDtos(Mapper.toDto(current), domain)) {
                        return resolve({ dto: Mapper.toDto(current), status: SaveStatus.NotChanged });
                    }
                    return this.validateName(domain).then((valid) => {
                        if (!valid) {
                            return resolve({ status: SaveStatus.NameConflict });
                        }
                        const status = current.deleted ? SaveStatus.Created : SaveStatus.Updated;
                        return this.repository
                            .update(Mapper.toUpdatedDomain(domain, current))
                            .then((domain) => resolve({ status, dto: Mapper.toDto(domain) }));
                    });
                })
                .catch((err) => reject(err))
        );
    }

    public mergeById(id: string, dto: DomainDto): Promise<SaveResult<DomainDto>> {
        const domain: DomainDto = { ...dto, id };
        return this.repository.findById(id, true).then((current) => this.merge(domain, current));
    }

    public mergeByName(name: string, dto: DomainDto): Promise<SaveResult<DomainDto>> {
        const domain: DomainDto = { ...dto };
        return this.repository.findByName(name, true).then((current) => this.merge(domain, current));
    }

    public deleteById(id: string): Promise<SaveResult<DomainDto>> {
        return this.hostRepository.getCount(id).then((count) => {
            if (count > 0) {
                return Promise.resolve({ status: SaveStatus.NotDeletable });
            }
            return this.repository
                .delete(id)
                .then((found) =>
                    Promise.resolve({ status: found ? SaveStatus.Deleted : SaveStatus.NotFound } as SaveResult<DomainDto>)
                );
        });
    }

    public deleteByName(name: string): Promise<SaveResult<DomainDto>> {
        return this.findByName(name).then((domain) =>
            domain ? this.deleteById(domain.id!) : Promise.resolve({ status: SaveStatus.NotFound })
        );
    }

    private merge(dto: DomainDto, current?: Domain): Promise<SaveResult<DomainDto>> {
        if (!current) {
            return this.create(dto);
        }
        const merged = { ...dto, id: current.id, data: merge({}, current.data, dto.data) };
        if (!current.deleted && DomainUtils.areEqualDomainDtos(Mapper.toDto(current), merged)) {
            return Promise.resolve({ dto: Mapper.toDto(current), status: SaveStatus.NotChanged });
        }
        return this.validateName(merged).then((valid) => {
            if (!valid) {
                return Promise.resolve({ status: SaveStatus.NameConflict } as SaveResult<DomainDto>);
            }
            if (current.deleted) {
                return this.repository
                    .update(Mapper.toUpdatedDomain({ ...dto }, current))
                    .then((domain) => Promise.resolve({ dto: Mapper.toDto(domain), status: SaveStatus.Created }))
                    .catch((err) => Promise.reject(err));
            }
            return this.repository
                .update(Mapper.toUpdatedDomain(merged, current))
                .then((domain) => Promise.resolve({ dto: Mapper.toDto(domain), status: SaveStatus.Updated }))
                .catch((err) => Promise.reject(err));
        });
    }

    private validateName(domain: DomainDto): Promise<boolean> {
        const { id, name } = domain;
        return new Promise((resolve, reject) =>
            this.repository
                .findByName(name, true)
                .then((domain) => resolve(!domain || domain.id === id))
                .catch((err) => reject(err))
        );
    }
}
