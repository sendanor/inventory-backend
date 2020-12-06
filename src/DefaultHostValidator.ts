import Host from './types/Host';
import HostValidator from './types/HostValidator'

let validate: HostValidator;
validate = function (host: Host): Promise<Host> { return Promise.resolve(host) }
export default validate
