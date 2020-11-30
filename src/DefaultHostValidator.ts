import Host from './Host';
import HostValidator from './HostValidator'

let validate: HostValidator;
validate = function (host: Host): Promise<Host> { return Promise.resolve(host) }
export default validate