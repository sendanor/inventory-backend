// Copyright (c) 2020 Sendanor. All rights reserved.

import { HostRepository } from "../types/HostRepository";
import Mapper from "../types/HostMapper";
import Host, { HostDto } from "../types/Host";
import HostUtils from "./HostUtils";
import { merge } from "../modules/lodash";
import { SaveResult, SaveStatus } from "../types/SaveResult";
import PageDto from "../types/PageDto";

export default class HostManager {
    private repository: HostRepository;

    constructor(repository: HostRepository) {
        this.repository = repository;
    }

    public findById(domainId: string, id: string): Promise<HostDto | undefined> {
        return new Promise((resolve, reject) =>
            this.repository
                .findById(domainId, id)
                .then((host) => resolve(host ? Mapper.toDto(host) : undefined))
                .catch((err) => reject(err))
        );
    }

    public findByName(domainId: string, name: string): Promise<HostDto | undefined> {
        return new Promise((resolve, reject) =>
            this.repository
                .findByName(domainId, name)
                .then((host) => resolve(host ? Mapper.toDto(host) : undefined))
                .catch((err) => reject(err))
        );
    }

    public getPage(domainId: string, page: number, size: number, search?: string): Promise<PageDto<HostDto>> {
        const hostsPromise = this.repository.getPage(domainId, page, size, search);
        const countPromise = this.repository.getCount(domainId, search);
        return Promise.all([hostsPromise, countPromise]).then((values) => {
            const hosts = (values[0] as Host[]).map((h) => Mapper.toDto(h));
            const pageNumber = page;
            const pageSize = size;
            const totalCount = values[1] as number;
            const pageCount = Math.ceil(totalCount / size);
            return { entities: hosts, pageNumber, pageSize, totalCount, pageCount };
        });
    }

    public create(dto: HostDto): Promise<SaveResult<HostDto>> {
        const host: Host = { ...dto, version: 1, createdTime: new Date() };
        return new Promise((resolve, reject) =>
            this.validateName(host)
                .then((valid) =>
                    valid
                        ? this.repository
                              .create(host)
                              .then((host) => resolve({ dto: Mapper.toDto(host), status: SaveStatus.Created }))
                        : resolve({ status: SaveStatus.NameConflict })
                )
                .catch((err) => reject(err))
        );
    }

    public saveById(dto: HostDto): Promise<SaveResult<HostDto>> {
        const host: HostDto = { ...dto };
        const id = host.id!;
        return new Promise((resolve, reject) =>
            this.repository
                .findById(host.domainId, id, true)
                .then((current) => {
                    if (!current) {
                        return resolve(this.create(host));
                    }
                    if (!current.deleted && HostUtils.areEqualHostDtos(Mapper.toDto(current), host)) {
                        return resolve({ dto: Mapper.toDto(current), status: SaveStatus.NotChanged });
                    }
                    return this.validateName(host).then((valid) => {
                        if (!valid) {
                            return resolve({ status: SaveStatus.NameConflict });
                        }
                        const status = current.deleted ? SaveStatus.Created : SaveStatus.Updated;
                        return this.repository
                            .update(Mapper.toUpdatedHost(host, current))
                            .then((host) => resolve({ status, dto: Mapper.toDto(host) }));
                    });
                })
                .catch((err) => reject(err))
        );
    }

    public mergeById(id: string, dto: HostDto): Promise<SaveResult<HostDto>> {
        const host: HostDto = { ...dto, id };
        return this.repository.findById(host.domainId, id, true).then((current) => this.merge(host, current));
    }

    public mergeByName(name: string, dto: HostDto): Promise<SaveResult<HostDto>> {
        const host: HostDto = { ...dto };
        return this.repository.findByName(host.domainId, name, true).then((current) => this.merge(host, current));
    }

    public deleteById(domainId: string, id: string): Promise<boolean> {
        return this.repository.delete(domainId, id).then((found) => Promise.resolve(found));
    }

    public deleteByName(domainId: string, name: string): Promise<boolean> {
        return this.findByName(domainId, name).then((host) =>
            host ? this.repository.delete(domainId, host.id!) : Promise.resolve(false)
        );
    }

    private merge(dto: HostDto, current?: Host): Promise<SaveResult<HostDto>> {
        if (!current) {
            return this.create(dto);
        }
        const merged = { ...dto, id: current.id, data: merge({}, current.data, dto.data) };
        if (!current.deleted && HostUtils.areEqualHostDtos(Mapper.toDto(current), merged)) {
            return Promise.resolve({ dto: Mapper.toDto(current), status: SaveStatus.NotChanged });
        }
        return this.validateName(merged).then((valid) => {
            if (!valid) {
                return Promise.resolve({ status: SaveStatus.NameConflict } as SaveResult<HostDto>);
            }
            if (current.deleted) {
                return this.repository
                    .update(Mapper.toUpdatedHost({ ...dto }, current))
                    .then((host) => Promise.resolve({ dto: Mapper.toDto(host), status: SaveStatus.Created }))
                    .catch((err) => Promise.reject(err));
            }
            return this.repository
                .update(Mapper.toUpdatedHost(merged, current))
                .then((host) => Promise.resolve({ dto: Mapper.toDto(host), status: SaveStatus.Updated }))
                .catch((err) => Promise.reject(err));
        });
    }

    private validateName(host: HostDto): Promise<boolean> {
        const { id, domainId, name } = host;
        return new Promise((resolve, reject) =>
            this.repository
                .findByName(domainId, name, true)
                .then((host) => resolve(!host || host.id === id))
                .catch((err) => reject(err))
        );
    }
}
