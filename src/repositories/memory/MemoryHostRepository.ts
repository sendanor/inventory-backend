import { HostRepository } from '../../HostRepository'
import Host, { HostPage, HostSaveResult } from '../../Host'
import {isEqual, has, get, set, keys, map, slice} from "../../modules/lodash";
import LogService from "../../services/LogService";
import {v4 as uuidV4} from "uuid";

const LOG = LogService.createLogger('MemoryHostRepository');

class MemoryHostRepository implements HostRepository {

    private _cache : Record<string, Host>;

    public constructor () {
        this._cache = {};
    }

    public initialize(): void {
        this._cache = {};
    }

    public get (id: string): Promise<Host | undefined> {
        return new Promise((resolve, reject) => {

            try {
                if (has(this._cache, id)) {
                    resolve({...this._cache[id]});
                } else {
                    resolve(undefined);
                }
            } catch (err) {
                reject(err);
            }

        });
    }

    public getPage (page: number, size: number): Promise<HostPage> {

        return new Promise ( (resolve, reject) => {
            try {

                const allKeys : Array<string> = keys(this._cache);

                const allHosts = map(allKeys, (key : string) : Host => this._cache[key]);

                // FIXME: handle input limits correctly

                const hosts = slice(allHosts, (page-1) * size, size).map(
                    (host: Host) : Host => {
                        return {...host};
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

    public create (host: Host): Promise<HostSaveResult> {

        const newHost : Host = {
            ...host,
            id: undefined
        };

        if (!newHost?.name) {
            LOG.debug('create: host = ', host);
            throw new TypeError('The host must have a name');
        }

        return new Promise((resolve, reject) => {
            try {

                newHost.id = uuidV4();

                if (has(this._cache, newHost.id)) {
                    // FIXME: Handle correctly
                    throw new TypeError('The host resource already exists: ' + newHost.id);
                }

                this._cache[newHost.id] = newHost;

                resolve({
                    host: {
                        ...newHost
                    },
                    changed: true
                });

            } catch (err) {
                reject(err);
            }

        });
    }

    public update (id: string, host: Host): Promise<HostSaveResult> {

        let newHost : Host = {
            ...host
        };

        return new Promise((resolve, reject) => {

            try {

                const current : Host | undefined = has(this._cache, id) ? this._cache[id] : undefined;

                if (current) {

                    if ( current.name === host.name && isEqual(current.data, host.data) ) {

                        resolve({ host: {...current}, changed: false });

                    } else {

                        newHost = this._cache[id] = {...current, ...newHost};

                        resolve({ host: {...newHost}, changed: true });

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
