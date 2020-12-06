import Host, { HostPage, HostSaveResult } from './Host';

/**
 * Persistence implementation for hosts. All functions in this interface (except initialize()) return a Promise.
 */
export interface HostRepository {

    /**
     * Initializes the repository. It's optional.
     *
     * This method is called right after instantiation before any other function calls.
     */
    initialize?(): void

    /**
     * Destroy the repository. It's optional.
     *
     * This method is called right before the controller is going to be destroyed.
     */
    destroy?(): void

    /**
     * Searches for a host by an id
     *
     * @param id Id of the host to search for
     * @param allowDeleted true, if hosts marked as 'deleted' should be searched also
     * @returns Host, if one was found, undefined otherwise
     */
    findById(id: string, allowDeleted?: true): Promise<Host | undefined>

    /**
     * Searches for a host by a name
     *
     * @param name Name of the host to search for
     * @param allowDeleted true, if hosts marked as 'deleted' should be searched also
     * @returns Host, if one was found, undefined otherwise
     */
    findByName(name: string, allowDeleted?: true): Promise<Host | undefined>

    /**
     * Gets one page of hosts
     *
     * @param page page number, starting from 1
     * @param size page size
     * @returns Page of hosts
     */
    getPage(page: number, size: number): Promise<HostPage>

    /**
     * Creates a new host
     *
     * @param host Host data
     * @param id? Id to be assigned for a new host. If undefined, storage should generate the id
     * @returns HostSaveResult indicating result of save operation
     */
    create(host: Host, id?: string): Promise<HostSaveResult>

    /**
     * Updates an existing host
     *
     * @param host Host data
     * @param id Id of the host to be updated
     * @returns HostSaveResult indicating result of save operation
     */
    update(host: Host, id: string): Promise<HostSaveResult>

    /**
     * Deletes a host
     *
     * @param id Id of the host to be deleted
     * @returns True, if delete succeeded
     */
    delete(id: string): Promise<boolean>

}

export default HostRepository;
