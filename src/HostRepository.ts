import Host, { HostPage, HostSaveResult } from './Host';

export interface HostRepository {
    initialize(): void
    get(id: string): Promise<Host|undefined>
    getPage(page: number, size: number): Promise<HostPage>
    create(host: Host): Promise<HostSaveResult>
    update(id: string, host: Host): Promise<HostSaveResult>
    delete(id: string): Promise<boolean>
}
