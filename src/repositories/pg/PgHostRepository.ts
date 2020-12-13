// Copyright (c) 2020 Sendanor. All rights reserved.

import { Pool } from "pg"
import { HostRepository } from '../../types/HostRepository'
import Host from '../../types/Host'
import LogService from "../../services/LogService";
import { PG_DBNAME, PG_HOST, PG_PASSWORD, PG_PORT, PG_USER } from "../../constants/env";

const LOG = LogService.createLogger('PgHostRepository');

const findById = 'SELECT * FROM hosts WHERE "domainId" = $1 AND id = $2 AND NOT deleted'
const findByIdAllowDeleted = 'SELECT * FROM hosts WHERE "domainId" = $1 AND id = $2'
const findByName = 'SELECT * FROM hosts WHERE "domainId" = $1 AND name = $2 AND NOT deleted'
const findByNameAllowDeleted = 'SELECT * FROM hosts WHERE "domainId" = $1 AND name = $2'
const getPage = 'SELECT * FROM hosts WHERE "domainId" = $1 AND NOT deleted ORDER BY name OFFSET $2 LIMIT $3'
const totalCount = 'SELECT COUNT(*) FROM hosts WHERE "domainId" = $1 AND NOT deleted'
const insert = 'INSERT INTO hosts("domainId", name, data, "createdTime") VALUES($1, $2, $3, $4) RETURNING *'
const insertWithId = 'INSERT INTO hosts(id, "domainId", name, data, "createdTime") VALUES($1, $2, $3, $4, $5) RETURNING *'
const update = 'UPDATE hosts SET name = $3, data = $4, "createdTime" = $5, "modifiedTime" = $6, deleted = $7, "deletedTime" = $8 WHERE "domainId" = $1 AND id = $2 RETURNING *'
const remove = 'UPDATE hosts SET deleted = true, "deletedTime" = $3 WHERE "domainId" = $1 AND id = $2 AND NOT deleted RETURNING *'

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

    public findById(domainId: string, id: string, allowDeleted?: boolean): Promise<Host | undefined> {
        return new Promise((resolve, reject) => {
            this.pool.query(allowDeleted ? findByIdAllowDeleted : findById, [domainId, id])
                .then(response => resolve(response.rows[0]))
                .catch(err => reject(err))
        })
    }

    public findByName(domainId: string, name: string, allowDeleted?: boolean): Promise<Host | undefined> {
        return new Promise((resolve, reject) => {
            this.pool.query(allowDeleted ? findByNameAllowDeleted : findByName, [domainId, name])
                .then(response => resolve(response.rows[0]))
                .catch(err => reject(err))
        })
    }

    public getPage(domainId: string, page: number, size: number): Promise<Host[]> {
        return new Promise((resolve, reject) => {
            this.pool.query(getPage, [domainId, (page - 1) * size, size])
                .then(response => resolve(response.rows))
                .catch(err => reject(err))
        })
    }

    public getCount(domainId: string): Promise<number> {
        return new Promise((resolve, reject) => {
            this.pool.query(totalCount, [domainId])
                .then(response => resolve(response.rows[0].count))
                .catch(err => reject(err))
        })
    }

    public create(host: Host): Promise<Host> {
        const { id, domainId, name, data, createdTime } = host
        return new Promise((resolve, reject) => {
            const idArr: any[] = id ? [id] : []
            const params = idArr.concat(domainId, name, data, createdTime)
            this.pool.query(id ? insertWithId : insert, params)
                .then(response => resolve(response.rows[0]))
                .catch(err => reject(err))
        })
    }

    public update(host: Host): Promise<Host> {
        const { id, domainId, name, data, createdTime, modifiedTime, deleted, deletedTime } = host
        return new Promise((resolve, reject) => {
            const params = [domainId, id!, name, data, createdTime, modifiedTime, deleted, deletedTime]
            this.pool.query(update, params)
                .then(response => resolve(response.rows[0]))
                .catch(err => reject(err))
        })
    }

    public delete(domainId: string, id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.pool.query(remove, [domainId, id, new Date()])
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