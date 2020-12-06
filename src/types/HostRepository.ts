import Host, { HostPage, HostSaveResult } from './Host';

export interface HostRepository {
    initialize(): void
    findById(id: string, allowDeleted?: true): Promise<Host | undefined>
    findByName(id: string, allowDeleted?: true): Promise<Host | undefined>
    getPage(page: number, size: number): Promise<HostPage>
    create(host: Host, id?: string): Promise<HostSaveResult>
    update(host: Host, id: string): Promise<HostSaveResult>
    delete(id: string): Promise<boolean>
}

export default HostRepository;
