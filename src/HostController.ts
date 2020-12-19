// Copyright (c) 2020 Sendanor. All rights reserved.

import { IncomingMessage, ServerResponse } from "http"
import { HostRepository } from "./types/HostRepository"
import HostManager from "./services/HostManager"
import { SaveResult, SaveStatus } from './types/SaveResult'
import Host, { HostDto } from './types/Host'
import validate from './DefaultHostValidator'
import LogService from "./services/LogService";
import { ControllerUtils as Utils, Request, Method, Status } from './services/ControllerUtils'

const LOG = LogService.createLogger('HostController');

export class HostController {

    private manager: HostManager

    constructor(repository: HostRepository) {
        this.manager = new HostManager(repository)
    }

    public processRequest(req: IncomingMessage, res: ServerResponse, request: Request) {
        const { method, hostId, domainId, hostName, page, size } = { ...request, domainId: request.domainId! }

        if (method === Method.GET && hostId) {
            this.manager.findById(domainId, hostId)
                .then(host => Utils.writeResponse(res, host ? Status.OK : Status.NotFound, host, false))
                .catch(err => Utils.writeInternalError(res, err, LOG))

        } else if (method === Method.GET && hostName) {
            this.manager.findByName(domainId, hostName)
                .then(host => Utils.writeResponse(res, host ? Status.OK : Status.NotFound, host, false))
                .catch(err => Utils.writeInternalError(res, err, LOG))

        } else if (method === Method.GET && page && size) {
            this.manager.getPage(domainId, page, size)
                .then(page => Utils.writeResponse(res, Status.OK, page, false))
                .catch(err => Utils.writeInternalError(res, err, LOG))

        } else if (method === Method.POST && !hostId && !hostName) {
            this.getValidRequestBody(req)
                .then(host => this.manager.create({ domainId, name: host.name, data: host.data })
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => Utils.writeInternalError(res, err, LOG)))
                .catch(err => Utils.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.PUT && hostId) {
            this.getValidRequestBody(req)
                .then(host => this.manager.saveById({ domainId, id: hostId, name: host.name, data: host.data })
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => Utils.writeInternalError(res, err, LOG)))
                .catch(err => Utils.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.PATCH && hostId) {
            this.getValidRequestBody(req)
                .then(host => this.manager.mergeById(hostId, { ...host, domainId })
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => Utils.writeInternalError(res, err, LOG)))
                .catch(err => Utils.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.PATCH && hostName) {
            this.getValidRequestBody(req)
                .then(host => this.manager.mergeByName(hostName, { ...host, domainId })
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => Utils.writeInternalError(res, err, LOG)))
                .catch(err => Utils.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.DELETE && hostId) {
            this.manager.deleteById(domainId, hostId)
                .then(found => Utils.writeResponse(res, found ? Status.OK : Status.NotFound, {}, found))
                .catch(err => Utils.writeInternalError(res, err, LOG))

        } else if (method === Method.DELETE && hostName) {
            this.manager.deleteByName(domainId, hostName)
                .then(found => Utils.writeResponse(res, found ? Status.OK : Status.NotFound, {}, found))
                .catch(err => Utils.writeInternalError(res, err, LOG))

        } else {
            Utils.writeBadRequest(res, new Error('Invalid request'), LOG)
        }
    }

    private handleSaveResult(result: SaveResult<Host>, response: ServerResponse) {
        const payload = result.entity ? this.sanitizeHost(result.entity) : null
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

    private sanitizeHost(host: Host) {
        const { id, domainId, name, data } = host
        return {
            id, domainId, name, data
        };
    }

    private getValidRequestBody(req: IncomingMessage): Promise<HostDto> {
        return Utils.getBody(req).then(body => {
            if (body.name && body.data) {
                return validate(body)
            }
            throw new Error('Name and/or data property is missing')
        }).catch(err => Promise.reject(err))
    }
}

export default HostController
