
export enum InventoryRepository {

    PG     = 'pg',
    MEMORY = 'memory'

}

export default InventoryRepository;

export function parseInventoryRepository (value: string) : InventoryRepository {
    switch (value) {
        case 'pg'     : return InventoryRepository.PG;
        case 'memory' : return InventoryRepository.MEMORY;
        default       : throw new TypeError(`Unsupported inventory repository: "${value}"`);
    }
}
