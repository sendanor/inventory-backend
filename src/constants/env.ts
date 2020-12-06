import InventoryLogLevel from "../types/InventoryLogLevel";
import LogUtils from "../services/LogUtils";
import InventoryRepository, {parseInventoryRepository} from "../types/InventoryRepository";

export const IB_LISTEN_PORT = process?.env?.IB_LISTEN_PORT ? parseInt(process?.env?.IB_LISTEN_PORT, 10) : 3000;

export const IB_LISTEN_HOSTNAME = process?.env?.IB_LISTEN_HOSTNAME ?? 'localhost';

export const IB_REPOSITORY : InventoryRepository = process?.env?.IB_REPOSITORY ? parseInventoryRepository(process?.env?.IB_REPOSITORY) : InventoryRepository.PG;

export const PG_HOST : string = process?.env?.PG_HOST ?? 'localhost';

export const PG_PORT : number = process?.env?.PG_PORT ? parseInt(process?.env?.PG_PORT, 10) : 5432;

export const PG_DBNAME : string = process?.env?.PG_DBNAME ?? 'ib';

export const PG_USER : string = process?.env?.PG_USER ?? 'ib';

export const PG_PASSWORD : string | undefined = process?.env?.PG_PASSWORD ?? undefined;

/**
 * The default log level
 */
export const IB_LOG_LEVEL : InventoryLogLevel = LogUtils.parseLogLevelString(process?.env?.IB_LOG_LEVEL ?? "INFO" );
