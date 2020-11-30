import Host from './Host';

export default interface HostValidator {
    (host: Host): Promise<Host>
}