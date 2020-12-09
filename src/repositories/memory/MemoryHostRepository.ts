import { HostRepository } from '../../types/HostRepository'
import Host from '../../types/Host'
import { has, keys, map, slice, filter, find, remove, forEach } from "../../modules/lodash";
import LogService from "../../services/LogService";
import { v4 as uuidV4 } from "uuid";
import HostUtils from "../../services/HostUtils";

const LOG = LogService.createLogger('MemoryHostRepository');

/**
 * When generating a new ID, loop maximum this times until throwing an error
 */
const MAXIMUM_ID_GENERATION_LOOP_TIMES = 100;

/**
 * Interval in microseconds when to delete soft deleted content
 */
const HARD_DELETE_INTERVAL = 300 * 1000;

interface CacheRecord {

    deleted: boolean;

    host: Host;

}

interface DeleteIntervalCallback {
    (): void
}

export class MemoryHostRepository implements HostRepository {

    private _cache: Record<string, CacheRecord>;

    /**
     * Interval when to delete deleted records
     *
     * @private
     */
    private _intervalListener: any | undefined;

    private readonly _intervalCallback: DeleteIntervalCallback;

    public constructor() {

        this._cache = {};
        this._intervalListener = undefined;
        this._intervalCallback = this.onInterval.bind(this);

    }

    public onInterval() {

        this._deleteSoftDeletedItems();

    }

    public initialize(): void {

        this._cache = {};

        this._intervalListener = setInterval(this._intervalCallback, HARD_DELETE_INTERVAL);

    }

    public destroy(): void {

        if (this._intervalListener !== undefined) {
            clearInterval(this._intervalListener);
            this._intervalListener = undefined;
        }

    }

    public findById(id: string, allowDeleted?: true): Promise<Host | undefined> {
        return new Promise((resolve, reject) => {

            try {
                if (has(this._cache, id)) {

                    const record: CacheRecord = this._cache[id];
                    const host: Host = record.host;

                    if (allowDeleted === true) {
                        resolve({ ...host });
                    } else if (!record.deleted) {
                        resolve({ ...host });
                    } else {
                        resolve(undefined);
                    }

                } else {
                    resolve(undefined);
                }
            } catch (err) {
                reject(err);
            }

        });
    }

    public findByName(name: string, allowDeleted?: true): Promise<Host | undefined> {
        return new Promise((resolve, reject) => {

            try {

                // FIXME: This could use another cache for names, except performance probably isn't the problem since memory host repository is
                //        only meant for development.

                const allRecords: Array<CacheRecord> = map(keys(this._cache), (key: string): CacheRecord => this._cache[key]);
                const record: CacheRecord | undefined = find(allRecords, (record: CacheRecord): boolean => record.host.name === name);

                if (record !== undefined) {

                    const host: Host = record.host;

                    if (allowDeleted === true) {
                        resolve({ ...host });
                    } else if (!record.deleted) {
                        resolve({ ...host });
                    } else {
                        resolve(undefined);
                    }

                } else {
                    resolve(undefined);
                }
            } catch (err) {
                reject(err);
            }

        });
    }

    public getPage(page: number, size: number): Promise<Host[]> {
        throw new Error('Not implemented')

        // return new Promise((resolve, reject) => {
        //     try {

        //         const allKeys: Array<string> = keys(this._cache);

        //         const allActiveRecords: Array<CacheRecord> = filter(
        //             map(allKeys, (key: string): CacheRecord => this._cache[key]),
        //             (record: CacheRecord) => !record.deleted
        //         );

        //         // FIXME: handle input limits correctly

        //         const hosts = slice(allActiveRecords, (page - 1) * size, size).map(
        //             (record: CacheRecord): Host => {
        //                 return { ...record.host };
        //             }
        //         );

        //         const totalCount = allActiveRecords.length;

        //         const pageCount = Math.ceil(totalCount / size);

        //         resolve({
        //             hosts,
        //             totalCount,
        //             pageCount
        //         });

        //     } catch (err) {
        //         reject(err);
        //     }
        // });

    }

    public getCount(): Promise<number> {
        throw new Error('Not implemented')
    }

    public create(host: Host): Promise<Host> {
        throw new Error('Not implemented')

        // const newHost: Host = { ...host };

        // return new Promise((resolve, reject) => {
        //     try {

        //         let newId: string = id ?? this._createId();

        //         let status: SaveStatus = SaveStatus.NotChanged;

        //         if (has(this._cache, newId)) {

        //             const record: CacheRecord = this._cache[newId];
        //             const host: Host = record.host;

        //             if (HostUtils.areEqualHostsIncludingId(newHost, host)) {
        //                 status = SaveStatus.NotChanged;
        //             } else {
        //                 this._cache[newId] = {
        //                     host: newHost,
        //                     deleted: false
        //                 };
        //                 status = SaveStatus.Updated;
        //             }

        //         } else {

        //             this._cache[newId] = {
        //                 host: newHost,
        //                 deleted: false
        //             };
        //             status = SaveStatus.Created;

        //         }

        //         resolve({
        //             host: {
        //                 ...newHost
        //             },
        //             status: status
        //         });

        //     } catch (err) {
        //         reject(err);
        //     }
        // });

    }

    public update(host: Host): Promise<Host> {
        throw new Error('Not implemented')

        // const newHost: Host = {
        //     ...host,
        //     id: id
        // };

        // return new Promise((resolve, reject) => {
        //     try {

        //         let status: SaveStatus = SaveStatus.NotChanged;

        //         if (has(this._cache, id)) {

        //             const record: CacheRecord = this._cache[id];
        //             const host: Host = record.host;

        //             if (HostUtils.areEqualHostsIncludingId(newHost, host)) {
        //                 status = SaveStatus.NotChanged;
        //             } else {
        //                 this._cache[id].host = newHost;
        //                 status = SaveStatus.Updated;
        //             }

        //         } else {

        //             this._cache[id] = {
        //                 host: newHost,
        //                 deleted: false
        //             };
        //             status = SaveStatus.Created;

        //         }

        //         resolve({
        //             host: { ...newHost },
        //             status: status
        //         });

        //     } catch (err) {
        //         reject(err);
        //     }
        // });

    }

    public delete(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {

            try {

                if (has(this._cache, id)) {

                    const record: CacheRecord = this._cache[id];

                    record.deleted = true;

                    resolve(true);

                } else {
                    resolve(false);
                }

            } catch (err) {
                reject(err);
            }

        });
    }

    protected _createId(): string {

        let id;

        // Generate a new id until the new ID doesn't exist in the database
        let i = MAXIMUM_ID_GENERATION_LOOP_TIMES;
        do {
            id = uuidV4();
            i -= 1;
            if (i < 0) {
                throw new Error('Failed to generate a unique ID');
            }
        } while (!(id && !has(this._cache, id)));

        return id;

    }

    protected _deleteSoftDeletedItems() {

        let softDeletedItems: number = 0;

        forEach(keys(this._cache), (key: string) => {

            const item = this._cache[key];

            if (item.deleted) {
                delete this._cache[key];
                softDeletedItems += 1;
            }

        });

        if (softDeletedItems >= 1) {
            LOG.info(`Deleted permanently ${softDeletedItems} items which were previously soft deleted`);
        } else {
            LOG.debug('There were no soft deleted items.');
        }

    }

}

export function createRepository(): HostRepository {
    const repository = new MemoryHostRepository();
    repository.initialize();
    return repository;
}

export default createRepository;
