// Copyright (c) 2020 Sendanor. All rights reserved.

import { ObserverCallback, ObserverDestructor } from "../services/Observable";

export enum RepositoryEvent {
    RESOURCE_CREATED = "resourceCreated",
    RESOURCE_UPDATED = "resourceUpdated",
    RESOURCE_DELETED = "resourceDeleted",
}

export interface ObservableRepository<T> {
    on(name: RepositoryEvent, callback: ObserverCallback<RepositoryEvent>): ObserverDestructor;
}

export default ObservableRepository;
