// Copyright (c) 2020 Sendanor. All rights reserved.

import Observable, { ObserverCallback, ObserverDestructor } from "../services/Observable";
import Domain from "../types/Domain";
import DomainRepository from "../types/DomainRepository";
import ObservableRepository, { RepositoryEvent as RepositoryEvent } from "../types/ObservableRepository";

export default class DomainRepositoryAdapter implements DomainRepository, ObservableRepository<Domain> {
    private _observer: Observable<RepositoryEvent>;
    private _repository: DomainRepository;

    constructor(repository: DomainRepository) {
        this._repository = repository;
        this._observer = new Observable<RepositoryEvent>("DomainRepositoryAdapter");
    }

    initialize?(): void {
        this._repository.initialize && this._repository.initialize();
    }

    destroy?(): void {
        this._repository.destroy && this._repository.destroy();
    }

    findById(id: string, allowDeleted?: true): Promise<Domain | undefined> {
        return this._repository.findById(id, allowDeleted);
    }

    findByName(name: string, allowDeleted?: true): Promise<Domain | undefined> {
        return this._repository.findByName(name, allowDeleted);
    }

    getPage(page: number, size: number): Promise<Domain[]> {
        return this._repository.getPage(page, size);
    }

    getCount(): Promise<number> {
        return this._repository.getCount();
    }

    create(domain: Domain): Promise<Domain> {
        return this._repository
            .create(domain)
            .then((result) => {
                this._observer.triggerEvent(RepositoryEvent.RESOURCE_CREATED, result);
                return result;
            })
            .catch((err) => Promise.reject(err));
    }

    update(domain: Domain): Promise<Domain> {
        return this._repository
            .update(domain)
            .then((result) => {
                this._observer.triggerEvent(RepositoryEvent.RESOURCE_UPDATED, result);
                return result;
            })
            .catch((err) => Promise.reject(err));
    }

    delete(id: string): Promise<boolean> {
        return this._repository
            .delete(id)
            .then((found) => {
                if (found) {
                    return this._repository.findById(id, true).then((result) => {
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
