import { IncomingMessage, ServerResponse } from "http"
import { HostRepository } from "./HostRepository"
import Host, { HostSaveResult } from './Host'
import validate from './DefaultHostValidator'
import LogService from "./services/LogService";

const LOG = LogService.createLogger('HostController');

export enum Method {
    GET = 'get',
    POST = 'post',
    PUT = 'put',
    DELETE = 'delete',
}

export enum Status {
    OK = 200,
    BadRequest = 400,
    NotFound = 404,
    Conflict = 409,
    InternalError = 500,
}

export interface Request {
    method?: Method,
    url: string,
    id?: string,
    page?: number,
    size?: number
}

export class HostController {

    private repository: HostRepository

    constructor(repository: HostRepository) {
        this.repository = repository
    }

    public requestListener(msg: IncomingMessage, res: ServerResponse) {
        this.parseRequest(msg)
            .then(request => this.processRequest(msg, res, request))
            .catch(err => this.writeBadRequest(res, err))
    }

    private parseRequest(req: IncomingMessage): Promise<Request> {
        return new Promise((resolve, _) => {
            const idPattern: RegExp = /\/hosts\/([\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12})/
            const sizePattern: RegExp = /\/hosts.+size=(.+)/
            const pagePattern: RegExp = /\/hosts.+page=(.+)/
            const url = req.url!
            const idMatch = url.match(idPattern)
            const pageMatch = url.match(pagePattern)
            const sizeMatch = url.match(sizePattern)
            const id = idMatch ? idMatch[1] : undefined
            const page = pageMatch ? parseInt(pageMatch[1]) : undefined
            const size = sizeMatch ? parseInt(sizeMatch[1]) : undefined
            switch (req.method!.toLowerCase()) {
                case 'get': resolve({ method: Method.GET, url, id, page, size })
                case 'post': resolve({ method: Method.POST, url })
                case 'put': resolve({ method: Method.PUT, url, id })
                case 'delete': resolve({ method: Method.DELETE, url, id })
            }
            resolve({ url, id })
        })
    }

    public processRequest(req: IncomingMessage, res: ServerResponse, request: Request) {
        const { method, url, id, page, size } = request

        if (method === Method.GET && id) {
            this.repository.get(id)
                .then(host => this.writeResponse(res, host ? Status.OK : Status.NotFound, host, false))
                .catch(err => this.writeError(res, err))

        } else if (method === Method.GET && page && size) {
            this.repository.getPage(page, size)
                .then(hosts => this.writeResponse(res, Status.OK, hosts, false))
                .catch(err => this.writeError(res, err))

        } else if (method === Method.POST && url === '/hosts') {
            this.getValidRequestBody(req)
                .then(host => this.repository.create(host)
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => this.writeError(res, err)))
                .catch(err => this.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.PUT && id) {
            this.getValidRequestBody(req)
                .then(host => this.repository.update(id, host)
                    .then(result => this.handleSaveResult(result, res))
                    .catch(err => this.writeError(res, err)))
                .catch(err => this.writeResponse(res, Status.BadRequest, err.message, false))

        } else if (method === Method.DELETE && id) {
            this.repository.delete(id)
                .then(found => this.writeResponse(res, found ? Status.OK : Status.NotFound, {}, found))
                .catch(err => this.writeError(res, err))

        } else {
            this.writeBadRequest(res, new Error('Invalid request'))
        }
    }

    handleSaveResult(result: HostSaveResult, response: ServerResponse) {
        if (result.nameConflict) {
            this.writeResponse(response, Status.Conflict, 'Name already exists', false)
        } else {
            this.writeResponse(response, Status.OK, result.host, result.changed)
        }
    }

    getValidRequestBody(req: IncomingMessage): Promise<Host> {
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
            payload: payload ?? '',
            changed: changed,
        }
        res.end(JSON.stringify(response))
    }

    private writeBadRequest(res: ServerResponse, err: Error) {
        LOG.debug('Sent BadRequest error to the client: ', err);
        this.writeResponse(res, Status.BadRequest, err.message, false)
    }

    private writeError(res: ServerResponse, err: any) {
        LOG.error('InternalError: ', err);
        this.writeResponse(res, Status.InternalError, undefined, false)
    }

}

export default HostController
