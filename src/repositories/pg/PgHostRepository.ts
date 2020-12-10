import { Pool } from "pg"
import { HostRepository } from '../../types/HostRepository'
import Host from '../../types/Host'
import LogService from "../../services/LogService";
import { PG_DBNAME, PG_HOST, PG_PASSWORD, PG_PORT, PG_USER } from "../../constants/env";

const LOG = LogService.createLogger('PgHostRepository');

const findById = 'SELECT * FROM hosts WHERE id = $1 AND NOT deleted'
const findByIdAllowDeleted = 'SELECT * FROM hosts WHERE id = $1'
const findByName = 'SELECT * FROM hosts WHERE name = $1 AND NOT deleted'
const findByNameAllowDeleted = 'SELECT * FROM hosts WHERE name = $1'
const getPage = 'SELECT * FROM hosts WHERE NOT deleted ORDER BY name OFFSET $1 LIMIT $2'
const totalCount = 'SELECT COUNT(*) FROM hosts WHERE NOT deleted'
const insert = 'INSERT INTO hosts(name, data, "createdTime") VALUES($1, $2, $3) RETURNING *'
const insertWithId = 'INSERT INTO hosts(id, name, data, "createdTime") VALUES($1, $2, $3, $4) RETURNING *'
const update = 'UPDATE hosts SET name = $2, data = $3, "createdTime" = $4, "modifiedTime" = $5, deleted = $6, "deletedTime" = $7 WHERE id = $1 RETURNING *'
const remove = 'UPDATE hosts SET deleted = true, "deletedTime" = $2 WHERE id = $1 AND NOT deleted RETURNING *'

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

    public findByName(name: string, allowDeleted?: boolean): Promise<Host | undefined> {
        return new Promise((resolve, reject) => {
            this.pool.query(allowDeleted ? findByNameAllowDeleted : findByName, [name])
                .then(response => resolve(response.rows[0]))
                .catch(err => reject(err))
        })
    }

    public getPage(page: number, size: number): Promise<Host[]> {
        return new Promise((resolve, reject) => {
            this.pool.query(getPage, [(page - 1) * size, size])
                .then(response => resolve(response.rows))
                .catch(err => reject(err))
        })
    }

    public getCount(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.pool.query(totalCount, [])
                .then(response => resolve(response.rows[0].count))
                .catch(err => reject(err))
        })
    }

    public create(host: Host): Promise<Host> {
        const newHost = { ...host }
        const id = newHost.id
        return new Promise((resolve, reject) => {
            const idArr: any[] = id ? [id] : []
            const params = idArr.concat(newHost.name, newHost.data, newHost.createdTime)
            this.pool.query(id ? insertWithId : insert, params)
                .then(response => resolve(response.rows[0]))
                .catch(err => reject(err))
        })
    }

    public update(host: Host): Promise<Host> {
        const newHost = { ...host }
        return new Promise((resolve, reject) => {
            const params = [newHost.id, newHost.name, newHost.data, newHost.createdTime, newHost.modifiedTime, newHost.deleted, newHost.deletedTime]
            this.pool.query(update, params)
                .then(response => resolve(response.rows[0]))
                .catch(err => reject(err))
        })
    }

    public delete(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.pool.query(remove, [id, new Date()])
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