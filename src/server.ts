import { ProcessUtils } from './services/ProcessUtils'
ProcessUtils.initEnvFromDefaultFiles();

import { createRepository as createPgRepository } from "./repositories/pg/PgHostRepository"
import { createRepository as createMemoryRepository } from "./repositories/memory/MemoryHostRepository"
import HostController from "./HostController"

import HTTP = require('http')
import {IB_LISTEN_HOSTNAME, IB_LISTEN_PORT, IB_REPOSITORY} from "./constants/env";
import LogService from "./services/LogService";
import HostRepository from "./types/HostRepository";
import InventoryRepository from "./types/InventoryRepository";

const LOG = LogService.createLogger('server');

function createRepository () : HostRepository {
    switch (IB_REPOSITORY) {

        case InventoryRepository.PG:
            return createPgRepository();

        case InventoryRepository.MEMORY:
            return createMemoryRepository();

        default:
            throw new TypeError(`Unimplemented inventory repository: ${IB_REPOSITORY}`);

    }
}

try {

    const controller = new HostController(createRepository());
    const server = HTTP.createServer(controller.requestListener.bind(controller));
    server.listen(IB_LISTEN_PORT, IB_LISTEN_HOSTNAME);

    LOG.info(`Listening at http://${IB_LISTEN_HOSTNAME}:${IB_LISTEN_PORT} using repository "${IB_REPOSITORY}"`);

} catch(err) {
    LOG.error('ERROR: ', err);
}
