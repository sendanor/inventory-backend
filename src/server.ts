#!/usr/bin/env node
// Copyright (c) 2020 Sendanor. All rights reserved.

import { ProcessUtils } from './services/ProcessUtils'
ProcessUtils.initEnvFromDefaultFiles();

import { createRepository as createPgHostRepository } from "./repositories/pg/PgHostRepository"
import { createRepository as createPgDomainRepository } from "./repositories/pg/PgDomainRepository"
import { createRepository as createMemoryRepository } from "./repositories/memory/MemoryHostRepository"
import MainController from "./MainController"

import HTTP = require('http')
import { IB_LISTEN, IB_LISTEN_HOSTNAME, IB_LISTEN_PORT, IB_REPOSITORY } from "./constants/env";
import LogService from "./services/LogService";
import HostRepository from "./types/HostRepository";
import DomainRepository from "./types/DomainRepository";
import InventoryRepository from "./types/InventoryRepository";
import ListenAdapter from "./services/ListenAdapter";
import DomainController from './DomainController';
import HostController from './HostController';

const LOG = LogService.createLogger('server');

function createRepository(): { domainRepository: DomainRepository, hostRepository: HostRepository } {
    switch (IB_REPOSITORY) {

        case InventoryRepository.PG:
            return { domainRepository: createPgDomainRepository(), hostRepository: createPgHostRepository() }

        case InventoryRepository.MEMORY:
            return { domainRepository: createPgDomainRepository(), hostRepository: createPgHostRepository() }
        // return createMemoryRepository();

        default:
            throw new TypeError(`Unimplemented inventory repository: ${IB_REPOSITORY}`);

    }
}

try {

    const repositories = createRepository()
    const domainController = new DomainController(repositories.domainRepository);
    const hostController = new HostController(repositories.hostRepository);
    const mainController = new MainController(domainController, hostController);

    const server = HTTP.createServer(mainController.requestListener.bind(mainController));

    const listenAdapter = new ListenAdapter(server, IB_LISTEN);

    const listenDestructor = listenAdapter.on(ListenAdapter.Event.SERVER_LISTENING, () => {
        LOG.info(`Listening at ${IB_LISTEN} using repository "${IB_REPOSITORY}"`);
    });

    listenAdapter.listen();

} catch (err) {
    LOG.error('ERROR: ', err);
}
