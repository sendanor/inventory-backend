// Copyright (c) 2020 Sendanor. All rights reserved.

export enum InventoryRepository {

    PG     = 'pg',
    MEMORY = 'memory'

}

export default InventoryRepository;

export function parseInventoryRepository (value: string) : InventoryRepository {
    switch (value) {

        case 'postgresql' :
        case 'psql'       :
        case 'pg'         : return InventoryRepository.PG;

        case 'mem':
        case 'memory' : return InventoryRepository.MEMORY;

        default       : throw new TypeError(`Unsupported inventory repository: "${value}"`);
    }
}
