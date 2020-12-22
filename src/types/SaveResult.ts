// Copyright (c) 2020 Sendanor. All rights reserved.

export enum SaveStatus {
    Created,
    Updated,
    Deleted,
    NotChanged,
    NameConflict,
    NotDeletable,
    NotFound,
}

export interface SaveResult<T> {
    entity?: T;
    status: SaveStatus;
}
