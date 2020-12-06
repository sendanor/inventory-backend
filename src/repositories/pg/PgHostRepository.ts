import { Pool } from "pg"
import { DatabaseError } from 'pg-protocol'
import { HostRepository } from '../../HostRepository'
import {isEqual} from "../../modules/lodash";
import LogService from "../../services/LogService";
import Host, { HostPage, HostSaveResult, SaveStatus } from '../../types/Host'
import {PG_DBNAME, PG_HOST, PG_PASSWORD, PG_PORT, PG_USER} from "../../constants/env";

const LOG = LogService.createLogger('PgHostRepository');

const findById = 'SELECT * FROM hosts WHERE id = $1 AND NOT deleted'
const findByIdAllowDeleted = 'SELECT * FROM hosts WHERE id = $1'
const getPage = 'SELECT * FROM hosts WHERE NOT deleted ORDER BY name OFFSET $1 LIMIT $2'
const findByName = 'SELECT * FROM hosts WHERE name = $1'
const totalCount = 'SELECT COUNT(*) FROM hosts WHERE NOT deleted'
const insert = 'INSERT INTO hosts(name, data, createdTime) VALUES($1, $2, $3) RETURNING *'
const insertWithId = 'INSERT INTO hosts(id, name, data, createdTime) VALUES($1, $2, $3, $4) RETURNING *'
const update = 'UPDATE hosts SET name = $2, data = $3, modifiedTime = $4, deleted = false, deletedTime = null WHERE id = $1 RETURNING *'
const remove = 'UPDATE hosts SET deleted = true, deletedTime = $2 WHERE id = $1 AND NOT deleted RETURNING *'
const uniqueViolationErrorCode = '23505'

class PgHostRepository implements HostRepository {
    private pool = {} as Pool

    public initialize(): void {
        this.pool = new Pool({
            host: PG_HOST,
            port: PG_PORT,
            database: PG_DBNAME,
            user: PG_USER,
            password: PG_PASSWORD
        });
    }

    public findById(id: string, allowDeleted?: boolean): Promise<Host | undefined> {
        return new Promise((resolve, reject) => {
            this.pool.query(allowDeleted ? findByIdAllowDeleted : findById, [id])
                .then(response => resolve(response.rows[0]))
                .catch(err => reject(err))
        })
    }

    public getById(id: string, allowDeleted?: boolean): Promise<Host> {
        return new Promise((resolve, reject) => {
            this.pool.query(allowDeleted ? findByIdAllowDeleted : findById, [id])
                .then(response => {
                    if (response.rowCount === 1) {
                        return resolve(response.rows[0])
                    }
                    throw new Error(`Host with id [${id}] was not found`)
                })
                .catch(err => reject(err))
        })
    }

    public getPage(page: number, size: number): Promise<HostPage> {
        const hostPromise = new Promise((resolve, reject) => {
            this.pool.query(getPage, [(page - 1) * size, size])
                .then(response => resolve(response.rows))
                .catch(err => reject(err))
        })
        const countPromise = new Promise((resolve, reject) => {
            this.pool.query(totalCount, [])
                .then(response => resolve(response.rows[0].count))
                .catch(err => reject(err))
        })
        return Promise.all([hostPromise, countPromise])
            .then(values => {
                const hosts = values[0] as Host[]
                const totalCount = values[1] as number
                const pageCount = Math.ceil(totalCount / size)
                return { hosts, totalCount, pageCount }
            })
    }

    public create(host: Host, id?: string): Promise<HostSaveResult> {
        const newHost = { ...host }
        return new Promise((resolve, reject) => {
            const query = id ? insertWithId : insert
            const params = id ? [id, newHost.name, newHost.data, new Date()] : [newHost.name, newHost.data, new Date()]
            this.pool.query(query, params)
                .then(response => resolve({ host: response.rows[0], status: SaveStatus.Created }))
                .catch(err => this.handleSaveError(err, resolve, reject))
        })
    }

    public createOrUpdate(host: Host, id: string): Promise<HostSaveResult> {
        const newHost = { ...host }
        return new Promise((resolve, reject) => {
            this.findById(id, true)
                .then(current => {
                    if (!current) {
                        return this.create(newHost, id).then(result => resolve(result))
                    } else {
                        if (this.areEqual(current, newHost)) {
                            return resolve({ host: current, status: SaveStatus.NotChanged })
                        }
                        const status = current.deleted ? SaveStatus.Created : SaveStatus.Updated
                        this.update(current, newHost)
                            .then(response => resolve({ host: response.rows[0], status }))
                    }
                })
                .catch(err => this.handleSaveError(err, resolve, reject))
        })
    }

    public save(host: Host): Promise<HostSaveResult> {
        const newHost = { ...host }
        return new Promise<HostSaveResult>((resolve, reject) => {
            this.create(newHost)
                .then(result => {
                    if (result.status !== SaveStatus.NameConflict) {
                        return resolve(result)
                    }
                    this.findByName(newHost.name).then(current => {
                        // FIXME: Handle undefined case
                        if (current === undefined) throw new TypeError('current was undefined');
                        if (this.areEqual(current, newHost)) {
                            return resolve({ host: current, status: SaveStatus.NotChanged })
                        }
                        const status = current.deleted ? SaveStatus.Created : SaveStatus.Updated
                        this.update(current, newHost)
                            .then(response => resolve({ host: response.rows[0], status }))
                            .catch(err => this.handleSaveError(err, resolve, reject))
                    })
                })
        })
    }

    public delete(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.pool.query(remove, [id, new Date()])
                .then(response => resolve(response.rowCount === 1))
                .catch(err => reject(err))
        })
    }

    private findByName(name: string): Promise<Host | undefined> {
        return new Promise((resolve, reject) => {
            this.pool.query(findByName, [name])
                .then(response => resolve(response.rows[0]))
                .catch(err => reject(err))
        })
    }

    private areEqual(current: Host, host: Host) {
        return !current.deleted && current.name === host.name && isEqual(current.data, host.data)
    }

    private update(current: Host, host: Host) {
        const modifiedTime = current.deleted ? null : new Date()
        return this.pool.query(update, [current.id, host.name, host.data, modifiedTime])
    }

    private handleSaveError(err: Error, resolve: (_: HostSaveResult) => void, reject: (_: Error) => void) {
        if (err instanceof DatabaseError && err.code === uniqueViolationErrorCode) {
            resolve({ status: SaveStatus.NameConflict })
        } else {
            reject(err)
        }
    }

}

export function createRepository(): HostRepository {
    const repository = new PgHostRepository();
    repository.initialize()
    return repository
}