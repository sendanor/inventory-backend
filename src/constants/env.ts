// Copyright (c) 2020 Sendanor. All rights reserved.

import InventoryLogLevel from "../types/InventoryLogLevel";
import LogUtils from "../services/LogUtils";
import InventoryRepository, { parseInventoryRepository } from "../types/InventoryRepository";

/**
 * This is the configuration string for server listener.
 *
 * It can be:
 *
 *   - http://localhost:3000
 *   - socket:///path/to/socket.sock
 *   - 3000
 *
 */
export const IB_LISTEN = process?.env?.IB_LISTEN ?? "http://localhost:3000";

/**
 * This changes the default value in ListenAdapter for HTTP port names.
 *
 * You should use IB_LISTEN.
 *
 * @deprecated
 */
export const IB_LISTEN_PORT = process?.env?.IB_LISTEN_PORT ? parseInt(process?.env?.IB_LISTEN_PORT, 10) : 3000;

/**
 * This changes the default value in ListenAdapter for HTTP hostnames.
 *
 * You should use IB_LISTEN.
 *
 * @deprecated
 */
export const IB_LISTEN_HOSTNAME = process?.env?.IB_LISTEN_HOSTNAME ?? "localhost";

export const IB_REPOSITORY: InventoryRepository = process?.env?.IB_REPOSITORY
    ? parseInventoryRepository(process?.env?.IB_REPOSITORY)
    : InventoryRepository.PG;

export const PG_HOST: string = process?.env?.PG_HOST ?? "localhost";

export const PG_PORT: number = process?.env?.PG_PORT ? parseInt(process?.env?.PG_PORT, 10) : 5432;

export const PG_DBNAME: string = process?.env?.PG_DBNAME ?? "ib";

export const PG_USER: string = process?.env?.PG_USER ?? "ib";

export const PG_PASSWORD: string | undefined = process?.env?.PG_PASSWORD ?? undefined;

export const IB_DEFAULT_PAGE_SIZE: number = process?.env?.IB_DEFAULT_PAGE_SIZE
    ? parseInt(process?.env?.IB_DEFAULT_PAGE_SIZE, 10)
    : 10;

/**
 * The default log level
 */
export const IB_LOG_LEVEL: InventoryLogLevel = LogUtils.parseLogLevelString(process?.env?.IB_LOG_LEVEL ?? "INFO");

export const IS_PRODUCTION = process?.env?.NODE_ENV === "production";
