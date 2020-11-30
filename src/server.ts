import { createRepository } from "./PgHostRepository"
import HostController from "./HostController"
import { ProcessUtils } from './ProcessUtils'
import HTTP = require('http')

ProcessUtils.initEnvFromDefaultFiles()
const controller = new HostController(createRepository())
const server = HTTP.createServer(controller.requestListener.bind(controller))
server.listen(3000, 'localhost')
