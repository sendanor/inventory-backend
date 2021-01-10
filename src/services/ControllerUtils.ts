// Copyright (c) 2020 Sendanor. All rights reserved.

import { IncomingMessage, ServerResponse } from "http";
import { IS_PRODUCTION } from "../constants/env";
import { SEARCH_PARAM_NAME } from "../types/Routes";
import LogService, { Logger } from "./LogService";

export enum Method {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete",
    PATCH = "patch",
}

export enum Status {
    OK = 200,
    Created = 201,
    BadRequest = 400,
    NotFound = 404,
    Conflict = 409,
    InternalError = 500,
}

export enum ResourceType {
    Domain,
    Host,
}

interface Request {
    url: string;
    method: Method;
    resource?: ResourceType;
    domainId?: string;
    domainName?: string;
    hostId?: string;
    hostName?: string;
    page: number;
    size: number;
    search?: string;
}

class ControllerUtils {
    static writeResponse(res: ServerResponse, status: Status, payload: any, changed: boolean) {
        res.setHeader("Content-Type", "application/json");
        res.setHeader("Content-Changed", String(changed));
        res.statusCode = status;
        const response = {
            timestamp: new Date().toISOString(),
            payload: payload ?? {},
            changed: changed,
        };
        res.end(JSON.stringify(response));
    }

    static getBody(req: IncomingMessage): Promise<any> {
        return new Promise((resolve, reject) => {
            const data: Array<Buffer> = [];
            req.on("data", (chunk: Buffer) => {
                data.push(chunk);
            });
            req.on("end", () => {
                try {
                    resolve(JSON.parse(Buffer.concat(data).toString("utf8")));
                } catch (err) {
                    reject(err);
                }
            });
        });
    }

    static writeBadRequest(res: ServerResponse, err: Error, logger: Logger) {
        logger.debug("Sent BadRequest error to the client: ", err);
        ControllerUtils.writeResponse(res, Status.BadRequest, { reason: err.message }, false);
    }

    static writeInternalError(res: ServerResponse, err: Error, logger: Logger) {
        logger.error("InternalError: ", err);
        const reason = IS_PRODUCTION ? { reason: "Internal server error" } : { ...err, stack: err.stack };
        ControllerUtils.writeResponse(res, Status.InternalError, reason, false);
    }

    static toSearchUrlString(search?: string) {
        return search ? `&${SEARCH_PARAM_NAME}=${search}` : "";
    }
}

export { Request, ControllerUtils };
