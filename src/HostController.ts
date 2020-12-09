import { IncomingMessage, ServerResponse } from "http"
import { HostRepository } from "./types/HostRepository"
import HostManager, { HostSaveResult, SaveStatus } from "./services/HostManager"
import Host, { HostDto } from './types/Host'
import validate from './DefaultHostValidator'
import LogService from "./services/LogService";

const LOG = LogService.createLogger('HostController');

export enum Method {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete',
    PATCH = 'patch',
}

export enum Status {
    OK = 200,
    Created = 201,
    BadRequest = 400,
    NotFound = 404,
    Conflict = 409,
    InternalError = 500,
}

export interface Request {
    method?: Method,
    url: string,
    id?: string,
    name?: string,
    page?: number,
    size?: number
}

export class HostController {

    private manager: HostManager

    constructor(repository: HostRepository) {
        this.manager = new HostManager(repository)
    }

    public requestListener(msg: IncomingMessage, res: ServerResponse) {
        this.parseRequest(msg)
            .then(request => this.processRequest(msg, res, request))
            .catch(err => this.writeBadRequest(res, err))
    }

    private parseRequest(req: IncomingMessage): Promise<Request> {
        return new Promise((resolve, _) => {
            const idPattern: RegExp = /\/hosts\/([\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12})/
            const namePattern: RegExp = /\/hosts\/(.+)/
            const sizePattern: RegExp = /\/hosts.+size=(.+)/
            const pagePattern: RegExp = /\/hosts.+page=(.+)/
            const url = req.url!
            const idMatch = url.match(idPattern)
            const nameMatch = !idMatch && url.match(namePattern)
            const pageMatch: Array<string> | null = url.match(pagePattern)
            const sizeMatch: Array<string> | null = url.match(sizePattern)
            const id = idMatch ? idMatch[1] : undefined
            const name = nameMatch ? decodeURI(nameMatch[1]) : undefined
            const page: number | undefined = this.parsePositiveIntMatch(pageMatch)
            const size: number | undefined = this.parsePositiveIntMatch(sizeMatch)
            switch (req.method!.toLowerCase()) {
                case 'get': resolve({ method: Method.GET, url, id, name, page, size }); return;
                case 'post': resolve({ method: Method.POST, url }); return;
                case 'put': resolve({ method: Method.PUT, url, id }); return;
                case 'delete': resolve({ method: Method.DELETE, url, id }); return;
                case 'patch': resolve({ method: Method.PATCH, url, id }); return;
            }
            resolve({ url, id })
        })
    }

    private parsePositiveIntMatch(match: Array<string> | null): number | undefined {
        if (match && parseInt(match[1], 10) > 0) {
            return parseInt(match[1], 10)
        }
        return undefined
    }

    public processRequest(req: IncomingMessage, res: ServerResponse, request: Request) {
        const { method, url, id, name, page, size } = request

        if (method === Method.GET && id) {
            this.manager.findById(id)
                .then(host => this.writeResponse(res, host ? Status.OK : Status.NotFound, host, false))
                .catch(err => this.writeInternalError(res, err))

        } else if (method === Method.GET && name) {
            this.manager.findByName(name)
                .then(host => this.writeResponse(res, host ? Status.OK : Status.NotFound, host, false))
                .catch(err => this.writeInternalError(res, err))

        } else if (method === Method.GET && page && size) {
            this.manager.getPage(page, size)
                .then(page => this.writeResponse(res, Status.OK, page, false))
                .catch(err => this.writeInternalError(res, err))

        } else if (method === Method.POST && url === '/hosts') {
            this.getValidRequestBody(req)
                .then(host => this.manager.create({ name: host.name, data: host.data })
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => this.writeInternalError(res, err)))
                .catch(err => this.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.PUT && id) {
            this.getValidRequestBody(req)
                .then(host => this.manager.saveById({ id, name: host.name, data: host.data })
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => this.writeInternalError(res, err)))
                .catch(err => this.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.PATCH && url === '/hosts') {
            this.getValidRequestBody(req)
                .then(host => this.manager.saveByName({ name: host.name, data: host.data })
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => this.writeInternalError(res, err)))
                .catch(err => this.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.DELETE && id) {
            this.manager.delete(id)
                .then(found => this.writeResponse(res, found ? Status.OK : Status.NotFound, {}, found))
                .catch(err => this.writeInternalError(res, err))

        } else {
            this.writeBadRequest(res, new Error('Invalid request'))
        }
    }

    private handleSaveResult(result: HostSaveResult, response: ServerResponse) {
        const payload = result.host ? this.sanitizeHost(result.host) : null
        switch (result.status) {
            case SaveStatus.Created:
                this.writeResponse(response, Status.Created, payload, true)
                break;
            case SaveStatus.Updated:
                this.writeResponse(response, Status.OK, payload, true)
                break;
            case SaveStatus.Deleted:
                this.writeResponse(response, Status.OK, null, true)
                break;
            case SaveStatus.NotChanged:
                this.writeResponse(response, Status.OK, payload, false)
                break;
            case SaveStatus.NameConflict:
                this.writeResponse(response, Status.Conflict, { reason: 'Name already exists' }, false)
                break;
        }
    }

    private sanitizeHost(host: Host) {
        return {
            id: host.id,
            name: host.name,
            data: host.data
        };
    }

    private getValidRequestBody(req: IncomingMessage): Promise<HostDto> {
        return this.getBody(req).then(body => {
            if (body.name && body.data) {
                return validate(body)
            }
            throw new Error('Name and/or data property is missing')
        }).catch(err => Promise.reject(err))
    }

    private getBody(req: IncomingMessage): Promise<Host> {
        return new Promise((resolve, reject) => {
            const data: Array<Buffer> = []
            req.on('data', (chunk: Buffer) => {
                data.push(chunk)
            });
            req.on('end', () => {
                try {
                    resolve(JSON.parse(Buffer.concat(data).toString('utf8')))
                } catch (err) {
                    reject(err)
                }
            });
        })
    }

    private writeResponse(res: ServerResponse, status: Status, payload: any, changed: boolean) {
        res.setHeader('Host-Changed', String(changed))
        res.statusCode = status
        const response = {
            timestamp: new Date().toISOString(),
            payload: payload ?? {},
            changed: changed,
        }
        res.end(JSON.stringify(response))
    }

    private writeBadRequest(res: ServerResponse, err: Error) {
        LOG.debug('Sent BadRequest error to the client: ', err);
        this.writeResponse(res, Status.BadRequest, { reason: err.message }, false)
    }

    private writeInternalError(res: ServerResponse, err: any) {
        LOG.error('InternalError: ', err);
        this.writeResponse(res, Status.InternalError, { reason: "Internal server error" }, false)
    }

}

export default HostController
