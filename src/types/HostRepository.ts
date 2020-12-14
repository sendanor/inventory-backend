// Copyright (c) 2020 Sendanor. All rights reserved.

import Host from './Host';

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
    findById(domainId: string, id: string, allowDeleted?: true): Promise<Host | undefined>

    /**
     * Searches for a host by a name
     *
     * @param name Name of the host to search for
     * @param allowDeleted true, if hosts marked as 'deleted' should be searched also
     * @returns Host, if one was found, undefined otherwise
     */
    findByName(domainId: string, name: string, allowDeleted?: true): Promise<Host | undefined>

    /**
     * Gets one page of hosts
     *
     * @param page page number, starting from 1
     * @param size page size
     * @returns Page of hosts sorted by name
     */
    getPage(domainId: string, page: number, size: number): Promise<Host[]>

    /**
     * Gets a total count of hosts
     */
    getCount(domainId: string): Promise<number>

    /**
     * Creates a new host
     *
     * @param host Host data. If data contains an id value, it is assigned for a new host.
     *             Otherwise, storage should generate the id
     * @returns Created host
     */
    create(host: Host): Promise<Host>

    /**
     * Updates an existing host
     *
     * @param host Host data
     * @param id Id of the host to be updated
     * @returns Updated host
     */
    update(host: Host): Promise<Host>

    /**
     * Deletes a host
     *
     * @param id Id of the host to be deleted
     * @returns True, if delete succeeded
     */
    delete(domainId: string, id: string): Promise<boolean>
}

export default HostRepository;
