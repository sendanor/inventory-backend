// Copyright (c) 2020 Sendanor. All rights reserved.

import { IB_LISTEN } from "./constants/env";
import { IncomingMessage, ServerResponse } from "http";
import HostManager from "./services/HostManager";
import { SaveResult, SaveStatus } from "./types/SaveResult";
import { HostDto } from "./types/Host";
import validate from "./DefaultHostValidator";
import LogService from "./services/LogService";
import { ControllerUtils as Utils, Request, Method, Status } from "./services/ControllerUtils";
import { DomainRoutePath, PAGE_PARAM_NAME, RootRoutePath, SIZE_PARAM_NAME } from "./types/Routes";
import PageDto from "./types/PageDto";

const LOG = LogService.createLogger("HostController");

export class HostController {
    private manager: HostManager;

    constructor(manager: HostManager) {
        this.manager = manager;
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
        const { hostId, domainId, hostName, page, size } = { ...request, domainId: request.domainId! };
        if (hostId) {
            this.manager
                .findById(domainId, hostId)
                .then((host) => Utils.writeResponse(res, host ? Status.OK : Status.NotFound, host && this.withUrl(host), false))
                .catch((err) => Utils.writeInternalError(res, err, LOG));
        } else if (hostName) {
            this.manager
                .findByName(domainId, hostName)
                .then((host) => Utils.writeResponse(res, host ? Status.OK : Status.NotFound, host && this.withUrl(host), false))
                .catch((err) => Utils.writeInternalError(res, err, LOG));
        } else if (page && size) {
            this.manager
                .getPage(domainId, page, size)
                .then((page) => Utils.writeResponse(res, Status.OK, this.pageWithUrl(page, request), false))
                .catch((err) => Utils.writeInternalError(res, err, LOG));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId/name or paging is required as GET parameters"), LOG);
        }
    }

    private processPost(msg: IncomingMessage, res: ServerResponse, request: Request) {
        const { hostId, domainId, hostName } = { ...request, domainId: request.domainId! };
        if (!hostId && !hostName) {
            this.getValidRequestBody(msg)
                .then((host) =>
                    this.manager
                        .create({ domainId, name: host.name, data: host.data })
                        .then((result) => this.handleSaveResult(result, res))
                        .catch((err) => Utils.writeInternalError(res, err, LOG))
                )
                .catch((err) => Utils.writeBadRequest(res, err, LOG));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId/name is not allowed as a POST parameter"), LOG);
        }
    }

    private processPut(msg: IncomingMessage, res: ServerResponse, request: Request) {
        const { hostId, domainId } = { ...request, domainId: request.domainId! };
        if (hostId) {
            this.getValidRequestBody(msg)
                .then((host) =>
                    this.manager
                        .saveById({ domainId, id: hostId, name: host.name, data: host.data })
                        .then((result) => this.handleSaveResult(result, res))
                        .catch((err) => Utils.writeInternalError(res, err, LOG))
                )
                .catch((err) => Utils.writeBadRequest(res, err, LOG));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId is required as a PUT parameter"), LOG);
        }
    }

    private processPatch(msg: IncomingMessage, res: ServerResponse, request: Request) {
        const { hostId, domainId, hostName } = { ...request, domainId: request.domainId! };
        if (hostId) {
            this.getValidRequestBody(msg)
                .then((host) =>
                    this.manager
                        .mergeById(hostId, { ...host, domainId })
                        .then((result) => this.handleSaveResult(result, res))
                        .catch((err) => Utils.writeInternalError(res, err, LOG))
                )
                .catch((err) => Utils.writeBadRequest(res, err, LOG));
        } else if (hostName) {
            this.getValidRequestBody(msg)
                .then((host) =>
                    this.manager
                        .mergeByName(hostName, { ...host, domainId })
                        .then((result) => this.handleSaveResult(result, res))
                        .catch((err) => Utils.writeInternalError(res, err, LOG))
                )
                .catch((err) => Utils.writeBadRequest(res, err, LOG));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId/name is required as a PATCH parameter"), LOG);
        }
    }

    private processDelete(res: ServerResponse, request: Request) {
        const { hostId, domainId, hostName } = { ...request, domainId: request.domainId! };
        if (hostId) {
            this.handleDeleteResult(res, this.manager.deleteById(domainId, hostId));
        } else if (hostName) {
            this.handleDeleteResult(res, this.manager.deleteByName(domainId, hostName));
        } else {
            Utils.writeBadRequest(res, new Error(":hostId/name is required as a DELETE parameter"), LOG);
        }
    }

    private handleDeleteResult(res: ServerResponse, promise: Promise<boolean>) {
        promise
            .then((found) => Utils.writeResponse(res, found ? Status.OK : Status.NotFound, {}, found))
            .catch((err) => Utils.writeInternalError(res, err, LOG));
    }

    private handleSaveResult(result: SaveResult<HostDto>, response: ServerResponse) {
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

    private getValidRequestBody(req: IncomingMessage): Promise<HostDto> {
        return Utils.getBody(req)
            .then((body) => {
                if (body.name && body.data) {
                    return validate(body);
                }
                throw new Error("Name and/or data property is missing");
            })
            .catch((err) => Promise.reject(err));
    }

    private withUrl(host: HostDto): HostDto {
        return {
            ...host,
            url: `${IB_LISTEN}${RootRoutePath.DOMAINS}/${host.domainId}${DomainRoutePath.HOSTS}/${host.id!}`,
        };
    }

    private pageWithUrl(hosts: PageDto<HostDto>, request: Request): PageDto<HostDto> {
        const { domainId, page, size } = request;
        const hostsWithUrl = hosts.entities.map((host) => this.withUrl(host));
        return {
            ...hosts,
            entities: hostsWithUrl,
            url:
                `${IB_LISTEN}${RootRoutePath.DOMAINS}/${domainId}${DomainRoutePath.HOSTS}` +
                `?${PAGE_PARAM_NAME}=${page}&${SIZE_PARAM_NAME}=${size}`,
        };
    }
}

export default HostController;
