#!/usr/bin/env node
// Copyright (c) 2020 Sendanor. All rights reserved.

import { ProcessUtils } from './services/ProcessUtils'
ProcessUtils.initEnvFromDefaultFiles();

import { createRepository as createPgRepository } from "./repositories/pg/PgHostRepository"
import { createRepository as createMemoryRepository } from "./repositories/memory/MemoryHostRepository"
import MainController from "./MainController"

import HTTP = require('http')
import { IB_LISTEN, IB_LISTEN_HOSTNAME, IB_LISTEN_PORT, IB_REPOSITORY } from "./constants/env";
import LogService from "./services/LogService";
import HostRepository from "./types/HostRepository";
import InventoryRepository from "./types/InventoryRepository";
import ListenAdapter from "./services/ListenAdapter";
import HostController from './HostController';

const LOG = LogService.createLogger('server');

function createRepository(): HostRepository {
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

    const hostController = new HostController(createRepository());
    const mainController = new MainController(hostController);

    const server = HTTP.createServer(mainController.requestListener.bind(mainController));

    const listenAdapter = new ListenAdapter(server, IB_LISTEN);

    const listenDestructor = listenAdapter.on(ListenAdapter.Event.SERVER_LISTENING, () => {
        LOG.info(`Listening at ${IB_LISTEN} using repository "${IB_REPOSITORY}"`);
    });

    listenAdapter.listen();

} catch (err) {
    LOG.error('ERROR: ', err);
}
