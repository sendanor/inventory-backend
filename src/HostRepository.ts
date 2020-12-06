import Host, { HostPage, HostSaveResult } from './Host';

export interface HostRepository {
    initialize(): void
    findById(id: string, allowDeleted?: true): Promise<Host | undefined>
    getById(id: string, allowDeleted?: true): Promise<Host>
    getPage(page: number, size: number): Promise<HostPage>
    create(host: Host, id?: string): Promise<HostSaveResult>
    createOrUpdate(host: Host, id: string): Promise<HostSaveResult>
    save(host: Host): Promise<HostSaveResult>
    delete(id: string): Promise<boolean>
}
