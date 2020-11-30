import { Pool } from "pg"
import { DatabaseError } from 'pg-protocol'
import { HostRepository } from './HostRepository'
import Host, { HostPage, HostSaveResult } from './Host'
import * as _ from 'lodash'

const get = 'SELECT * FROM hosts WHERE id = $1 AND NOT deleted'
const getPage = 'SELECT id, name, data FROM hosts WHERE NOT deleted ORDER BY name OFFSET $1 LIMIT $2'
const totalCount = 'SELECT COUNT(*) FROM hosts WHERE NOT deleted'
const insert = 'NSERT INTO hosts(name, data) VALUES($1, $2) RETURNING *'
const update = 'UPDATE hosts SET name = $2, data = $3 WHERE id = $1 AND NOT deleted RETURNING *'
const remove = 'DELETE FROM hosts WHERE id = $1 AND NOT deleted RETURNING *'
const uniqueViolationErrorCode = '23505'

class PgHostRepository implements HostRepository {
    private pool = {} as Pool

    public initialize(): void {
        this.pool = new Pool({
            host: process.env.PG_HOST,
            port: parseInt(process.env.PG_PORT, 10),
            database: process.env.PG_DBNAME,
            user: process.env.PG_USER,
            password: process.env.PG_PASSWORD,
        });
    }

    public get(id: string): Promise<Host | undefined> {
        return new Promise((resolve, reject) => {
            this.pool.query(get, [id])
                .then(response => resolve(response.rows[0]))
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

    public create(host: Host): Promise<HostSaveResult> {
        return new Promise((resolve, reject) => {
            this.pool.query(insert, [host.name, host.data])
                .then(response => resolve({ host: response.rows[0], changed: true }))
                .catch(err => this.handleSaveError(err, resolve, reject))
        })
    }

    public update(id: string, host: Host): Promise<HostSaveResult> {
        return new Promise((resolve, reject) => {
            this.get(id).then(current => {
                if (current.name === host.name && _.isEqual(current.data, host.data)) {
                    return resolve({ host: current, changed: false })
                }
                this.pool.query(update, [id, host.name, host.data])
                    .then(response => resolve({ host: response.rows[0], changed: true }))
                    .catch(err => this.handleSaveError(err, resolve, reject))
            })
        })
    }

    handleSaveError(err: any, resolve: any, reject: any) {
        if (err instanceof DatabaseError && err.code === uniqueViolationErrorCode) {
            resolve({ nameConflict: true })
        } else {
            reject(err)
        }
    }

    public delete(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.pool.query(remove, [id])
                .then(response => resolve(response.rowCount === 1))
                .catch(err => reject(err))
        })
    }
}

export function createRepository(): HostRepository {
    const repository = new PgHostRepository();
    repository.initialize()
    return repository
}