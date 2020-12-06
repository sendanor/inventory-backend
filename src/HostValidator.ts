import Host from './types/Host';

export default interface HostValidator {
    (host: Host): Promise<Host>
}