// Copyright (c) 2020 Sendanor. All rights reserved.

import { IncomingMessage, ServerResponse } from "http";
import LogService from "./services/LogService";
import { IB_DEFAULT_PAGE_SIZE } from "./constants/env";
import HostController from "./HostController";
import DomainController from "./DomainController";
import { DomainRoutePath, RootRoutePath, SIZE_PARAM_NAME, PAGE_PARAM_NAME, SEARCH_PARAM_NAME } from "./types/Routes";
import { ControllerUtils as Utils, Request, Method, Status, ResourceType } from "./services/ControllerUtils";
import { DomainDto } from "./types/Domain";

const LOG = LogService.createLogger("HostController");

export default class MainController {
    private domainController: DomainController;
    private hostController: HostController;
    private domainPattern: RegExp = new RegExp(`${RootRoutePath.DOMAINS}(?:/([^?/]+))?`);
    private hostPattern: RegExp = new RegExp(`${RootRoutePath.DOMAINS}/.*?${DomainRoutePath.HOSTS}(?:/([^?/]+))?`);
    private paramsPattern: RegExp = new RegExp(`${RootRoutePath.DOMAINS}(?:/.*?${DomainRoutePath.HOSTS})?(\\?.*)`);
    private sizePattern: RegExp = new RegExp(`[\\?&]${SIZE_PARAM_NAME}=(\\d+)`);
    private pagePattern: RegExp = new RegExp(`[\\?&]${PAGE_PARAM_NAME}=(\\d+)`);
    private searchPattern: RegExp = new RegExp(`[\\?&]${SEARCH_PARAM_NAME}=([^&]+)`);

    constructor(domainController: DomainController, hostController: HostController) {
        this.domainController = domainController;
        this.hostController = hostController;
    }

    public requestListener(msg: IncomingMessage, res: ServerResponse) {
        this.parseRequest(msg)
            .then((request) => {
                const { resource } = request;
                if (resource === ResourceType.Domain) {
                    this.domainController.processRequest(msg, res, request);
                } else if (resource === ResourceType.Host) {
                    this.findDomain(request).then((domain) => {
                        if (domain) {
                            this.hostController.processRequest(msg, res, { ...request, domainId: domain.id });
                        } else {
                            Utils.writeResponse(res, Status.NotFound, null, false);
                        }
                    });
                } else {
                    throw new Error("Invalid request uri");
                }
            })
            .catch((err) => Utils.writeBadRequest(res, err, LOG));
    }

    private findDomain(request: Request): Promise<DomainDto | undefined> {
        const { domainId, domainName } = request;
        if (domainId) {
            return this.domainController.getDomainManager().findById(domainId);
        }
        return this.domainController.getDomainManager().findByName(domainName!);
    }

    private parseRequest(req: IncomingMessage): Promise<Request> {
        return new Promise((resolve, reject) => {
            try {
                const url = req.url!;
                const { id: domainId, name: domainName } = this.parseIdOrName(url, this.domainPattern);
                const { id: hostId, name: hostName } = this.parseIdOrName(url, this.hostPattern);
                const method = this.getMethod(req.method!.toLowerCase());
                const resource = this.getResource(url);
                const params = this.getParams(url);
                const pageMatch: Array<string> | null = params.match(this.pagePattern);
                const sizeMatch: Array<string> | null = params.match(this.sizePattern);
                const searchMatch: Array<string> | null = params.match(this.searchPattern);
                const page = this.parsePositiveIntMatch(pageMatch, 1);
                const size = this.parsePositiveIntMatch(sizeMatch, IB_DEFAULT_PAGE_SIZE);
                const search = searchMatch ? decodeURIComponent(searchMatch[1]) : undefined;
                resolve({ url, method, resource, domainId, domainName, hostId, hostName, page, size, search });
            } catch (error) {
                reject(error);
            }
        });
    }

    private getMethod(method: string): Method {
        switch (method) {
            case "get":
                return Method.GET;
            case "post":
                return Method.POST;
            case "put":
                return Method.PUT;
            case "delete":
                return Method.DELETE;
            case "patch":
                return Method.PATCH;
            default:
                throw new Error(`Unsupported method: ${method}`);
        }
    }

    private getResource(url: string): ResourceType | undefined {
        if (url.match(this.hostPattern)) {
            return ResourceType.Host;
        }
        if (url.match(this.domainPattern)) {
            return ResourceType.Domain;
        }
        return undefined;
    }

    private getParams(url: string): string {
        const paramsMatch = url.match(this.paramsPattern);
        return (paramsMatch && paramsMatch[1]) ?? "";
    }

    private parseIdOrName(url: string, pattern: RegExp) {
        const idPattern: RegExp = /[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/;
        const match = url.match(pattern);
        if (!match || !match[1]) {
            return { id: undefined, name: undefined };
        }
        if (match[1].match(idPattern)) {
            return { id: match[1], name: undefined };
        }
        return { id: undefined, name: decodeURI(match[1]) };
    }

    private parsePositiveIntMatch(match: Array<string> | null, defaultValue: number): number {
        if (match && parseInt(match[1], 10) > 0) {
            return parseInt(match[1], 10);
        }
        return defaultValue;
    }
}
