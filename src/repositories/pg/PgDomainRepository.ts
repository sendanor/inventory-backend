// Copyright (c) 2020 Sendanor. All rights reserved.

import { Pool } from "pg";
import { DomainRepository } from "../../types/DomainRepository";
import Domain from "../../types/Domain";
import LogService from "../../services/LogService";
import { PG_DBNAME, PG_HOST, PG_PASSWORD, PG_PORT, PG_USER } from "../../constants/env";

const LOG = LogService.createLogger("PgDomainRepository");

const findById = "SELECT * FROM domains WHERE id = $1 AND NOT deleted";
const findByIdAllowDeleted = "SELECT * FROM domains WHERE id = $1";
const findByName = "SELECT * FROM domains WHERE name = $1 AND NOT deleted";
const findByNameAllowDeleted = "SELECT * FROM domains WHERE name = $1";
const getPage = "SELECT * FROM domains WHERE NOT deleted ORDER BY name OFFSET $1 LIMIT $2";
const totalCount = "SELECT COUNT(*) FROM domains WHERE NOT deleted";
const insert = 'INSERT INTO domains(name, data, "createdTime") VALUES($1, $2, $3) RETURNING *';
const insertWithId = 'INSERT INTO domains(id, name, data, "createdTime") VALUES($1, $2, $3, $4) RETURNING *';
const update =
    'UPDATE domains SET name = $2, data = $3, "createdTime" = $4, "modifiedTime" = $5, deleted = $6, "deletedTime" = $7 WHERE id = $1 RETURNING *';
const remove = 'UPDATE domains SET deleted = true, "deletedTime" = $2 WHERE id = $1 AND NOT deleted RETURNING *';

class PgDomainRepository implements DomainRepository {
    private pool = {} as Pool;

    public initialize(): void {
        this.pool = new Pool({
            host: PG_HOST,
            port: PG_PORT,
            database: PG_DBNAME,
            user: PG_USER,
            password: PG_PASSWORD,
        });
    }

    public findById(id: string, allowDeleted?: boolean): Promise<Domain | undefined> {
        return new Promise((resolve, reject) => {
            this.pool
                .query(allowDeleted ? findByIdAllowDeleted : findById, [id])
                .then((response) => resolve(response.rows[0]))
                .catch((err) => reject(err));
        });
    }

    public findByName(name: string, allowDeleted?: boolean): Promise<Domain | undefined> {
        return new Promise((resolve, reject) => {
            this.pool
                .query(allowDeleted ? findByNameAllowDeleted : findByName, [name])
                .then((response) => resolve(response.rows[0]))
                .catch((err) => reject(err));
        });
    }

    public getPage(page: number, size: number): Promise<Domain[]> {
        return new Promise((resolve, reject) => {
            this.pool
                .query(getPage, [(page - 1) * size, size])
                .then((response) => resolve(response.rows))
                .catch((err) => reject(err));
        });
    }

    public getCount(): Promise<number> {
        return new Promise((resolve, reject) => {
            this.pool
                .query(totalCount, [])
                .then((response) => resolve(parseInt(response.rows[0].count, 10)))
                .catch((err) => reject(err));
        });
    }

    public create(domain: Domain): Promise<Domain> {
        const { id, name, data, createdTime } = domain;
        return new Promise((resolve, reject) => {
            const idArr: any[] = id ? [id] : [];
            const params = idArr.concat(name, data, createdTime);
            this.pool
                .query(id ? insertWithId : insert, params)
                .then((response) => resolve(response.rows[0]))
                .catch((err) => reject(err));
        });
    }

    public update(domain: Domain): Promise<Domain> {
        const { id, name, data, createdTime, modifiedTime, deleted, deletedTime } = domain;
        return new Promise((resolve, reject) => {
            const params = [id!, name, data, createdTime, modifiedTime, deleted, deletedTime];
            this.pool
                .query(update, params)
                .then((response) => resolve(response.rows[0]))
                .catch((err) => reject(err));
        });
    }

    public delete(id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.pool
                .query(remove, [id, new Date()])
                .then((response) => resolve(response.rowCount === 1))
                .catch((err) => reject(err));
        });
    }
}

export function createRepository(): DomainRepository {
    const repository = new PgDomainRepository();
    repository.initialize();
    return repository;
}
