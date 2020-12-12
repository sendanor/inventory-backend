// Copyright (c) 2020 Sendanor. All rights reserved.

import { HostRepository } from '../../types/HostRepository'
import Host from '../../types/Host'
import { has, keys, map, slice, filter, find, forEach } from "../../modules/lodash";
import LogService from "../../services/LogService";
import { v4 as uuidV4 } from "uuid";

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
                        resolve({ ...host, deleted: record.deleted });
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
                const allRecords: Array<CacheRecord> = map(keys(this._cache), (key: string): CacheRecord => this._cache[key]);
                const record: CacheRecord | undefined = find(allRecords, (record: CacheRecord): boolean => record.host.name === name);

                if (record !== undefined) {
                    const host: Host = record.host;

                    if (allowDeleted === true) {
                        resolve({ ...host, deleted: record.deleted });
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
        return new Promise((resolve, reject) => {
            try {
                const allKeys: Array<string> = keys(this._cache);
                const allActiveRecords: Array<CacheRecord> = filter(
                    map(allKeys, (key: string): CacheRecord => this._cache[key]),
                    (record: CacheRecord) => !record.deleted
                );
                const hosts = slice(allActiveRecords, (page - 1) * size, page * size).map(
                    (record: CacheRecord): Host => {
                        return { ...record.host };
                    }
                );
                resolve(hosts);
            } catch (err) {
                reject(err);
            }
        });
    }

    public getCount(): Promise<number> {
        return new Promise((resolve, reject) => {
            try {
                const allKeys: Array<string> = keys(this._cache);
                const allActiveRecords: Array<CacheRecord> = filter(
                    map(allKeys, (key: string): CacheRecord => this._cache[key]),
                    (record: CacheRecord) => !record.deleted
                );
                resolve(allActiveRecords.length);
            } catch (err) {
                reject(err);
            }
        })
    }

    public create(host: Host): Promise<Host> {
        const newHost: Host = { ...host };
        return new Promise((resolve, reject) => {
            try {
                const newId: string = host.id ?? this._createId();
                if (has(this._cache, newId)) {
                    throw new TypeError(`Id ${newId} already exists`)
                }
                newHost.id = newId
                this._cache[newId] = {
                    host: newHost,
                    deleted: false
                };
                resolve({
                    ...newHost
                });
            } catch (err) {
                reject(err);
            }
        });

    }

    public update(host: Host): Promise<Host> {
        const id = host.id!
        const newHost: Host = {
            ...host,
        };
        return new Promise((resolve, reject) => {
            try {
                if (!has(this._cache, id)) {
                    throw new TypeError(`Id ${id} does not exist`)
                }
                const record: CacheRecord = this._cache[id];
                this._cache[id].host = newHost;
                this._cache[id].deleted = false;
                resolve({
                    ...newHost
                });
            } catch (err) {
                reject(err);
            }
        });

    }

    public delete(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                if (has(this._cache, id)) {
                    const record: CacheRecord = this._cache[id];
                    if (record.deleted) {
                        resolve(false)
                    } else {
                        record.deleted = true;
                        resolve(true);
                    }
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
