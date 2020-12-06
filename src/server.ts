import { createRepository } from "./PgHostRepository"
import HostController from "./HostController"
import { ProcessUtils } from './services/ProcessUtils'
import HTTP = require('http')
import {IB_LISTEN_HOSTNAME, IB_LISTEN_PORT} from "./constants/env";
import LogService from "./services/LogService";

const LOG = LogService.createLogger('server');

try {

    ProcessUtils.initEnvFromDefaultFiles();
    const controller = new HostController(createRepository());
    const server = HTTP.createServer(controller.requestListener.bind(controller));
    server.listen(IB_LISTEN_PORT, IB_LISTEN_HOSTNAME);

    LOG.info(`Listening at http://${IB_LISTEN_HOSTNAME}:${IB_LISTEN_PORT}`);

} catch(err) {
    LOG.error('ERROR: ', err);
}
