// Copyright (c) 2020 Sendanor. All rights reserved.

import { IncomingMessage, ServerResponse } from "http"
import { HostRepository } from "./types/HostRepository"
import HostManager, { HostSaveResult, SaveStatus } from "./services/HostManager"
import Host, { HostDto } from './types/Host'
import validate from './DefaultHostValidator'
import LogService from "./services/LogService";
import { IB_DEFAULT_PAGE_SIZE } from "./constants/env";
import HostController from "./HostController"
import { DomainRoutePath, RootRoutePath } from './types/Routes'
import { ControllerUtils as Utils, Request, Method, Status, ResourceType } from './services/ControllerUtils'

const LOG = LogService.createLogger('HostController');

export default class MainController {

    private hostController: HostController
    private domainPattern: RegExp = new RegExp(`${RootRoutePath.DOMAINS}(?:/([^?/]+))?`)
    private hostPattern: RegExp = new RegExp(`${RootRoutePath.DOMAINS}/.*?${DomainRoutePath.HOSTS}(?:/([^?/]+))?`)
    private paramsPattern: RegExp = new RegExp(`${RootRoutePath.DOMAINS}/.*?(?:/?:${DomainRoutePath.HOSTS}/.*?)?(\\?.*)`)
    private sizePattern: RegExp = /[?&]size=(\d+)/
    private pagePattern: RegExp = /[?&]page=(\d+)/

    constructor(hostController: HostController) {
        this.hostController = hostController
    }

    public requestListener(msg: IncomingMessage, res: ServerResponse) {
        this.parseRequest(msg)
            .then(request => {
                console.log(request)
                const { hostId, hostName, resource } = request
                if (resource === ResourceType.Domain) {
                    // this.hostController.processRequest(msg, res, request)
                } else if (resource === ResourceType.Host) {
                    this.hostController.processRequest(msg, res, request)
                    // this.writeBadRequest(res, new Error())
                } else {
                    throw new Error('Invalid request uri')
                }
            })
            .catch(err => Utils.writeBadRequest(res, err, LOG))
    }

    private parseRequest(req: IncomingMessage): Promise<Request> {
        return new Promise((resolve, reject) => {
            try {
                const url = req.url!
                const { id: domainId, name: domainName } = this.parseIdOrName(url, this.domainPattern)
                const { id: hostId, name: hostName } = this.parseIdOrName(url, this.hostPattern)
                const method = this.getMethod(req.method!.toLowerCase())
                const resource = this.getResource(url)
                const params = this.getParams(url)
                const pageMatch: Array<string> | null = params.match(this.pagePattern)
                const sizeMatch: Array<string> | null = params.match(this.sizePattern)
                const page = this.parsePositiveIntMatch(pageMatch, 1)
                const size = this.parsePositiveIntMatch(sizeMatch, IB_DEFAULT_PAGE_SIZE)
                resolve({ url, method, resource, domainId, domainName, hostId, hostName, page, size })
            } catch (error) {
                reject(error)
            }
        })
    }

    private getMethod(method: string): Method {
        switch (method) {
            case 'get': return Method.GET
            case 'post': return Method.POST
            case 'put': return Method.PUT
            case 'delete': return Method.DELETE
            case 'patch': return Method.PATCH
            default: throw new Error(`Unsupported method: ${method}`)
        }
    }

    private getResource(url: string): (ResourceType | undefined) {
        if (url.match(this.hostPattern)) {
            return ResourceType.Host
        }
        if (url.match(this.domainPattern)) {
            return ResourceType.Domain
        }
        return undefined
    }

    private getParams(url: string): string {
        const paramsMatch = url.match(this.paramsPattern)
        return (paramsMatch && paramsMatch[1]) ?? ''
    }

    private parseIdOrName(url: string, pattern: RegExp) {
        const idPattern: RegExp = /[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}/
        const match = url.match(pattern)
        if (!match || !match[1]) {
            return { id: undefined, name: undefined }
        }
        if (match[1].match(idPattern)) {
            return { id: match[1], name: undefined }
        }
        return { id: undefined, name: match[1] }
    }

    private parsePositiveIntMatch(match: Array<string> | null, defaultValue: number): number {
        if (match && parseInt(match[1], 10) > 0) {
            return parseInt(match[1], 10)
        }
        return defaultValue
    }
}
