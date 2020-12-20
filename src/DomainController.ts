// Copyright (c) 2020 Sendanor. All rights reserved.

import { IncomingMessage, ServerResponse } from "http";
import { DomainRepository } from "./types/DomainRepository";
import DomainManager from "./services/DomainManager";
import { SaveResult, SaveStatus } from "./types/SaveResult";
import Domain, { DomainDto } from "./types/Domain";
import validate from "./DefaultDomainValidator";
import LogService from "./services/LogService";
import { ControllerUtils as Utils, Request, Method, Status } from "./services/ControllerUtils";

const LOG = LogService.createLogger("DomainController");

export class DomainController {
    private manager: DomainManager;

    constructor(repository: DomainRepository) {
        this.manager = new DomainManager(repository);
    }

    public getDomainManager(): DomainManager {
        return this.manager;
    }

    public processRequest(msg: IncomingMessage, res: ServerResponse, request: Request) {
        const { method } = request;

        switch (method) {
            case Method.GET:
                this.processGet(res, request);
                break;
            case Method.POST:
                this.processPost(msg, res, request);
                break;
            case Method.PUT:
                this.processPut(msg, res, request);
                break;
            case Method.PATCH:
                this.processPatch(msg, res, request);
                break;
            case Method.DELETE:
                this.processDelete(res, request);
                break;
            default:
                Utils.writeBadRequest(res, new Error(`Unsupported method: ${method}`), LOG);
                break;
        }
    }

    private processGet(res: ServerResponse, request: Request) {
        const { domainId, domainName, page, size } = { ...request };
        if (domainId) {
            this.manager
                .findById(domainId)
                .then((domain) => Utils.writeResponse(res, domain ? Status.OK : Status.NotFound, domain, false))
                .catch((err) => Utils.writeInternalError(res, err, LOG));
        } else if (domainName) {
            this.manager
                .findByName(domainName)
                .then((domain) => Utils.writeResponse(res, domain ? Status.OK : Status.NotFound, domain, false))
                .catch((err) => Utils.writeInternalError(res, err, LOG));
        } else if (page && size) {
            this.manager
                .getPage(page, size)
                .then((page) => Utils.writeResponse(res, Status.OK, page, false))
                .catch((err) => Utils.writeInternalError(res, err, LOG));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId/name or paging is required as GET parameters"), LOG);
        }
    }

    private processPost(msg: IncomingMessage, res: ServerResponse, request: Request) {
        const { domainId, domainName } = { ...request };
        if (!domainId && !domainName) {
            this.getValidRequestBody(msg)
                .then((domain) =>
                    this.manager
                        .create({ name: domain.name, data: domain.data })
                        .then((result) => this.handleSaveResult(result, res))
                        .catch((err) => Utils.writeInternalError(res, err, LOG))
                )
                .catch((err) => Utils.writeResponse(res, Status.BadRequest, err.message, false));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId/name is not allowed as a POST parameter"), LOG);
        }
    }

    private processPut(msg: IncomingMessage, res: ServerResponse, request: Request) {
        const { domainId } = { ...request };
        if (domainId) {
            this.getValidRequestBody(msg)
                .then((domain) =>
                    this.manager
                        .saveById({ id: domainId, name: domain.name, data: domain.data })
                        .then((result) => this.handleSaveResult(result, res))
                        .catch((err) => Utils.writeInternalError(res, err, LOG))
                )
                .catch((err) => Utils.writeResponse(res, Status.BadRequest, err.message, false));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId is required as a PUT parameter"), LOG);
        }
    }

    private processPatch(msg: IncomingMessage, res: ServerResponse, request: Request) {
        const { domainId, domainName } = { ...request };
        if (domainId) {
            this.getValidRequestBody(msg)
                .then((domain) =>
                    this.manager
                        .mergeById(domainId, { ...domain })
                        .then((result) => this.handleSaveResult(result, res))
                        .catch((err) => Utils.writeInternalError(res, err, LOG))
                )
                .catch((err) => Utils.writeResponse(res, Status.BadRequest, err.message, false));
        } else if (domainName) {
            this.getValidRequestBody(msg)
                .then((domain) =>
                    this.manager
                        .mergeByName(domainName, { ...domain })
                        .then((result) => this.handleSaveResult(result, res))
                        .catch((err) => Utils.writeInternalError(res, err, LOG))
                )
                .catch((err) => Utils.writeResponse(res, Status.BadRequest, err.message, false));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId/name is required as a PATCH parameter"), LOG);
        }
    }

    private processDelete(res: ServerResponse, request: Request) {
        const { domainId, domainName } = { ...request };
        if (domainId) {
            this.manager
                .deleteById(domainId)
                .then((found) => Utils.writeResponse(res, found ? Status.OK : Status.NotFound, {}, found))
                .catch((err) => Utils.writeInternalError(res, err, LOG));
        } else if (domainName) {
            this.manager
                .deleteByName(domainName)
                .then((found) => Utils.writeResponse(res, found ? Status.OK : Status.NotFound, {}, found))
                .catch((err) => Utils.writeInternalError(res, err, LOG));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId/name is required as a DELETE parameter"), LOG);
        }
    }

    private handleSaveResult(result: SaveResult<Domain>, response: ServerResponse) {
        const payload = result.entity ? this.sanitizeDomain(result.entity) : null;
        switch (result.status) {
            case SaveStatus.Created:
                Utils.writeResponse(response, Status.Created, payload, true);
                break;
            case SaveStatus.Updated:
                Utils.writeResponse(response, Status.OK, payload, true);
                break;
            case SaveStatus.Deleted:
                Utils.writeResponse(response, Status.OK, null, true);
                break;
            case SaveStatus.NotChanged:
                Utils.writeResponse(response, Status.OK, payload, false);
                break;
            case SaveStatus.NameConflict:
                Utils.writeResponse(response, Status.Conflict, { reason: "Name already exists" }, false);
                break;
        }
    }

    private sanitizeDomain(domain: Domain) {
        const { id, name, data } = domain;
        return {
            id,
            name,
            data,
        };
    }

    private getValidRequestBody(req: IncomingMessage): Promise<DomainDto> {
        return Utils.getBody(req)
            .then((body) => {
                if (body.name && body.data) {
                    return validate(body);
                }
                throw new Error("Name and/or data property is missing");
            })
            .catch((err) => Promise.reject(err));
    }
}

export default DomainController;
