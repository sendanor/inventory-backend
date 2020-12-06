import { HostRepository } from '../../types/HostRepository'
import Host, { HostPage, HostSaveResult, SaveStatus } from '../../types/Host'
import { isEqual, has, keys, map, slice } from "../../modules/lodash";
import LogService from "../../services/LogService";
import { v4 as uuidV4 } from "uuid";
import HostUtils from "../../services/HostUtils";

const LOG = LogService.createLogger('MemoryHostRepository');

class MemoryHostRepository implements HostRepository {

    private _cache: Record<string, Host>;

    public constructor() {
        this._cache = {};
    }

    public initialize(): void {
        this._cache = {};
    }

    public findById(id: string, allowDeleted?: true): Promise<Host | undefined> {
        return new Promise((resolve, reject) => {

            try {
                if (has(this._cache, id)) {
                    resolve({ ...this._cache[id] });
                } else {
                    resolve(undefined);
                }
            } catch (err) {
                reject(err);
            }

        });
    }

    public findByName(name: string, allowDeleted?: true): Promise<Host | undefined> {
        throw new TypeError('Not supported')
    }

    public getById(id: string, allowDeleted?: true): Promise<Host> {
        return new Promise((resolve, reject) => {

            try {
                if (has(this._cache, id)) {
                    resolve({ ...this._cache[id] });
                } else {
                    throw new Error(`Host with id [${id}] was not found`)
                }
            } catch (err) {
                reject(err);
            }

        });
    }

    public getPage(page: number, size: number): Promise<HostPage> {

        return new Promise((resolve, reject) => {
            try {

                const allKeys: Array<string> = keys(this._cache);

                const allHosts = map(allKeys, (key: string): Host => this._cache[key]);

                // FIXME: handle input limits correctly

                const hosts = slice(allHosts, (page - 1) * size, size).map(
                    (host: Host): Host => {
                        return { ...host };
                    }
                );

                const totalCount = allHosts.length;

                const pageCount = Math.ceil(totalCount / size);

                resolve({
                    hosts,
                    totalCount,
                    pageCount
                });

            } catch (err) {
                reject(err);
            }

        });

    }

    public create(host: Host, id?: string): Promise<HostSaveResult> {

        const newHost: Host = {
            ...host,
            id: id
        };

        if (!newHost?.name) {
            LOG.debug('create: host = ', host);
            throw new TypeError('The host must have a name');
        }

        return new Promise((resolve, reject) => {
            try {

                let status: SaveStatus = SaveStatus.NotChanged;

                if (!newHost?.id) {
                    // FIXME: Handle case if the generated UUID already exists in the database
                    newHost.id = uuidV4();
                }

                if (has(this._cache, newHost.id)) {

                    if (HostUtils.areEqualHosts(newHost, this._cache[newHost.id])) {
                        status = SaveStatus.NotChanged;
                    } else {
                        this._cache[newHost.id!] = newHost;
                        status = SaveStatus.Updated;
                    }

                } else {

                    this._cache[newHost.id!] = newHost;
                    status = SaveStatus.Created;

                }

                resolve({
                    host: {
                        ...newHost
                    },
                    status: status
                });

            } catch (err) {
                reject(err);
            }
        });

    }

    public createOrUpdate(host: Host, id: string): Promise<HostSaveResult> {

        const newHost: Host = {
            ...host,
            id: undefined
        };

        if (!newHost?.name) {
            LOG.debug('create: host = ', host);
            throw new TypeError('The host must have a name');
        }

        return new Promise((resolve, reject) => {
            try {

                let status: SaveStatus = SaveStatus.NotChanged;

                if (!newHost?.id) {
                    // FIXME: Handle case if the generated UUID already exists in the database
                    newHost.id = uuidV4();
                }

                if (has(this._cache, newHost.id)) {

                    if (HostUtils.areEqualHosts(newHost, this._cache[newHost.id])) {
                        status = SaveStatus.NotChanged;
                    } else {
                        this._cache[newHost.id!] = newHost;
                        status = SaveStatus.Updated;
                    }

                } else {

                    this._cache[newHost.id!] = newHost;
                    status = SaveStatus.Created;

                }

                resolve({
                    host: {
                        ...newHost
                    },
                    status: status
                });

            } catch (err) {
                reject(err);
            }
        });
    }

    public save(host: Host): Promise<HostSaveResult> {

        let newHost: Host = {
            ...host
        };

        return new Promise((resolve, reject) => {

            try {

                const id = newHost?.id;

                if (!id) throw new TypeError('Id not defined');

                const current: Host | undefined = has(this._cache, id) ? this._cache[id] : undefined;

                if (current) {

                    if (HostUtils.areEqualHosts(current, newHost)) {

                        resolve({ host: { ...current }, status: SaveStatus.NotChanged });

                    } else {

                        newHost = this._cache[id] = { ...current, ...newHost };

                        resolve({ host: { ...newHost }, status: SaveStatus.Updated });

                    }

                } else {
                    // FIXME: This should be handled correctly. 404 maybe?
                    LOG.warn('No resource found for ID: ', id);
                }

            } catch (err) {
                reject(err);
            }

        });

    }

    public delete(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {

            try {

                if (has(this._cache, id)) {
                    delete this._cache[id];
                    resolve(true);
                } else {
                    resolve(false);
                }

            } catch (err) {
                reject(err);
            }

        });
    }

}

export function createRepository(): HostRepository {
    const repository = new MemoryHostRepository();
    repository.initialize();
    return repository;
}
