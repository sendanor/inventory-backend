// Copyright (c) 2020 Sendanor. All rights reserved.

import { IncomingMessage, ServerResponse } from "http";
import DomainManager from "./services/DomainManager";
import { SaveResult, SaveStatus } from "./types/SaveResult";
import { DomainDto } from "./types/Domain";
import validate from "./DefaultDomainValidator";
import LogService from "./services/LogService";
import { ControllerUtils as Utils, Request, Method, Status, ControllerUtils } from "./services/ControllerUtils";
import { IB_LISTEN } from "./constants/env";
import { PAGE_PARAM_NAME, RootRoutePath, SIZE_PARAM_NAME, SEARCH_PARAM_NAME } from "./types/Routes";
import PageDto from "./types/PageDto";

const LOG = LogService.createLogger("DomainController");

export class DomainController {
    private manager: DomainManager;

    constructor(manager: DomainManager) {
        this.manager = manager;
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
        const { domainId, domainName, page, size, search } = { ...request };
        if (domainId) {
            this.manager
                .findById(domainId)
                .then((domain) =>
                    Utils.writeResponse(res, domain ? Status.OK : Status.NotFound, domain && this.withUrl(domain), false)
                )
                .catch((err) => Utils.writeInternalError(res, err, LOG));
        } else if (domainName) {
            this.manager
                .findByName(domainName)
                .then((domain) =>
                    Utils.writeResponse(res, domain ? Status.OK : Status.NotFound, domain && this.withUrl(domain), false)
                )
                .catch((err) => Utils.writeInternalError(res, err, LOG));
        } else if (page && size) {
            this.manager
                .getPage(page, size, search)
                .then((page) => Utils.writeResponse(res, Status.OK, this.pageWithUrl(page, request), false))
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
                .catch((err) => Utils.writeBadRequest(res, err, LOG));
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
                .catch((err) => Utils.writeBadRequest(res, err, LOG));
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
                .catch((err) => Utils.writeBadRequest(res, err, LOG));
        } else if (domainName) {
            this.getValidRequestBody(msg)
                .then((domain) =>
                    this.manager
                        .mergeByName(domainName, { ...domain })
                        .then((result) => this.handleSaveResult(result, res))
                        .catch((err) => Utils.writeInternalError(res, err, LOG))
                )
                .catch((err) => Utils.writeBadRequest(res, err, LOG));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId/name is required as a PATCH parameter"), LOG);
        }
    }

    private processDelete(res: ServerResponse, request: Request) {
        const { domainId, domainName } = { ...request };
        if (domainId) {
            this.handleDeleteResult(res, this.manager.deleteById(domainId));
        } else if (domainName) {
            this.handleDeleteResult(res, this.manager.deleteByName(domainName));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId/name is required as a DELETE parameter"), LOG);
        }
    }

    private handleDeleteResult(res: ServerResponse, promise: Promise<SaveResult<DomainDto>>) {
        promise
            .then((result) => {
                const status =
                    result.status === SaveStatus.Deleted
                        ? Status.OK
                        : result.status === SaveStatus.NotDeletable
                        ? Status.Conflict
                        : Status.NotFound;
                const changed = result.status === SaveStatus.Deleted;
                Utils.writeResponse(res, status, { reason: "Domain having hosts cannot be removed" }, changed);
            })
            .catch((err) => Utils.writeInternalError(res, err, LOG));
    }

    private handleSaveResult(result: SaveResult<DomainDto>, response: ServerResponse) {
        const payload = result.dto ? this.withUrl(result.dto) : null;
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

    private withUrl(domain: DomainDto): DomainDto {
        return {
            ...domain,
            url: `${IB_LISTEN}${RootRoutePath.DOMAINS}/${domain.id}`,
        };
    }

    private pageWithUrl(domains: PageDto<DomainDto>, request: Request): PageDto<DomainDto> {
        const { page, size, search } = request;
        const domainsWithUrl = domains.entities.map((domain) => this.withUrl(domain));
        return {
            ...domains,
            entities: domainsWithUrl,
            url:
                `${IB_LISTEN}${RootRoutePath.DOMAINS}?${PAGE_PARAM_NAME}=${page}&${SIZE_PARAM_NAME}=${size}` +
                ControllerUtils.toSearchUrlString(search),
        };
    }
}

export default DomainController;
