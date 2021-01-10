// Copyright (c) 2020 Sendanor. All rights reserved.

import Observable, { ObserverCallback, ObserverDestructor } from "../services/Observable";
import Host from "../types/Host";
import HostRepository from "../types/HostRepository";
import ObservableRepository, { RepositoryEvent as RepositoryEvent } from "../types/ObservableRepository";

export default class HostRepositoryAdapter implements HostRepository, ObservableRepository<Host> {
    private _observer: Observable<RepositoryEvent>;
    private _repository: HostRepository;

    constructor(repository: HostRepository) {
        this._repository = repository;
        this._observer = new Observable<RepositoryEvent>("HostRepositoryAdapter");
    }

    initialize?(): void {
        this._repository.initialize && this._repository.initialize();
    }

    destroy?(): void {
        this._repository.destroy && this._repository.destroy();
    }

    findById(domainId: string, id: string, allowDeleted?: true): Promise<Host | undefined> {
        return this._repository.findById(domainId, id, allowDeleted);
    }

    findByName(domainId: string, name: string, allowDeleted?: true): Promise<Host | undefined> {
        return this._repository.findByName(domainId, name, allowDeleted);
    }

    getPage(domainId: string, page: number, size: number, search?: string): Promise<Host[]> {
        return this._repository.getPage(domainId, page, size, search);
    }

    getCount(domainId: string, search?: string): Promise<number> {
        return this._repository.getCount(domainId, search);
    }

    create(host: Host): Promise<Host> {
        return this._repository
            .create(host)
            .then((result) => {
                this._observer.triggerEvent(RepositoryEvent.RESOURCE_CREATED, result);
                return result;
            })
            .catch((err) => Promise.reject(err));
    }

    update(host: Host): Promise<Host> {
        return this._repository
            .update(host)
            .then((result) => {
                this._observer.triggerEvent(RepositoryEvent.RESOURCE_UPDATED, result);
                return result;
            })
            .catch((err) => Promise.reject(err));
    }

    delete(domainId: string, id: string): Promise<boolean> {
        return this._repository
            .delete(domainId, id)
            .then((found) => {
                if (found) {
                    return this._repository.findById(domainId, id, true).then((result) => {
                        this._observer.triggerEvent(RepositoryEvent.RESOURCE_DELETED, result);
                        return true;
                    });
                } else {
                    return false;
                }
            })
            .catch((err) => Promise.reject(err));
    }

    on(name: RepositoryEvent, callback: ObserverCallback<RepositoryEvent>): ObserverDestructor {
        return this._observer.listenEvent(name, callback);
    }
}
