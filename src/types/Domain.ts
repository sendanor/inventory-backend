// Copyright (c) 2020 Sendanor. All rights reserved.

export default interface Domain {
    id?: string;
    name: string;
    data: any;
    deleted?: boolean;
    createdTime: Date;
    modifiedTime?: Date;
    deletedTime?: Date;
}

export interface DomainDto {
    id?: string;
    name: string;
    data: any;
    url?: string;
}
