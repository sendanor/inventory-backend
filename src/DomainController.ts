// Copyright (c) 2020 Sendanor. All rights reserved.

import { IncomingMessage, ServerResponse } from "http"
import { DomainRepository } from "./types/DomainRepository"
import DomainManager from "./services/DomainManager"
import { SaveResult, SaveStatus } from './types/SaveResult'
import Domain, { DomainDto } from './types/Domain'
import validate from './DefaultDomainValidator'
import LogService from "./services/LogService";
import { ControllerUtils as Utils, Request, Method, Status } from './services/ControllerUtils'

const LOG = LogService.createLogger('DomainController');

export class DomainController {

    private manager: DomainManager

    constructor(repository: DomainRepository) {
        this.manager = new DomainManager(repository)
    }

    public getDomainManager(): DomainManager {
        return this.manager
    }

    public processRequest(req: IncomingMessage, res: ServerResponse, request: Request) {
        const { method, domainId, domainName, page, size } = { ...request }

        if (method === Method.GET && domainId) {
            this.manager.findById(domainId)
                .then(domain => Utils.writeResponse(res, domain ? Status.OK : Status.NotFound, domain, false))
                .catch(err => Utils.writeInternalError(res, err, LOG))

        } else if (method === Method.GET && domainName) {
            this.manager.findByName(domainName)
                .then(domain => Utils.writeResponse(res, domain ? Status.OK : Status.NotFound, domain, false))
                .catch(err => Utils.writeInternalError(res, err, LOG))

        } else if (method === Method.GET && page && size) {
            this.manager.getPage(page, size)
                .then(page => Utils.writeResponse(res, Status.OK, page, false))
                .catch(err => Utils.writeInternalError(res, err, LOG))

        } else if (method === Method.POST && !domainId && !domainName) {
            this.getValidRequestBody(req)
                .then(domain => this.manager.create({ name: domain.name, data: domain.data })
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => Utils.writeInternalError(res, err, LOG)))
                .catch(err => Utils.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.PUT && domainId) {
            this.getValidRequestBody(req)
                .then(domain => this.manager.saveById({ id: domainId, name: domain.name, data: domain.data })
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => Utils.writeInternalError(res, err, LOG)))
                .catch(err => Utils.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.PATCH && domainName) {
            this.getValidRequestBody(req)
                .then(domain => this.manager.mergeByName({ name: domainName, data: domain.data })
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => Utils.writeInternalError(res, err, LOG)))
                .catch(err => Utils.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.DELETE && domainId) {
            this.manager.deleteById(domainId)
                .then(found => Utils.writeResponse(res, found ? Status.OK : Status.NotFound, {}, found))
                .catch(err => Utils.writeInternalError(res, err, LOG))

        } else if (method === Method.DELETE && domainName) {
            this.manager.deleteByName(domainName)
                .then(found => Utils.writeResponse(res, found ? Status.OK : Status.NotFound, {}, found))
                .catch(err => Utils.writeInternalError(res, err, LOG))

        } else {
            Utils.writeBadRequest(res, new Error('Invalid request'), LOG)
        }
    }

    private handleSaveResult(result: SaveResult<Domain>, response: ServerResponse) {
        const payload = result.entity ? this.sanitizeDomain(result.entity) : null
        switch (result.status) {
            case SaveStatus.Created:
                Utils.writeResponse(response, Status.Created, payload, true)
                break;
            case SaveStatus.Updated:
                Utils.writeResponse(response, Status.OK, payload, true)
                break;
            case SaveStatus.Deleted:
                Utils.writeResponse(response, Status.OK, null, true)
                break;
            case SaveStatus.NotChanged:
                Utils.writeResponse(response, Status.OK, payload, false)
                break;
            case SaveStatus.NameConflict:
                Utils.writeResponse(response, Status.Conflict, { reason: 'Name already exists' }, false)
                break;
        }
    }

    private sanitizeDomain(domain: Domain) {
        const { id, name, data } = domain
        return {
            id, name, data
        };
    }

    private getValidRequestBody(req: IncomingMessage): Promise<DomainDto> {
        return Utils.getBody(req).then(body => {
            if (body.name && body.data) {
                return validate(body)
            }
            throw new Error('Name and/or data property is missing')
        }).catch(err => Promise.reject(err))
    }
}

export default DomainController
