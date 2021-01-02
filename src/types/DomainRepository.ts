// Copyright (c) 2020 Sendanor. All rights reserved.

import Domain from "./Domain";

/**
 * Persistence implementation for domains. All functions in this interface (except initialize()) return a Promise.
 */
export interface DomainRepository {
    /**
     * Initializes the repository. It's optional.
     *
     * This method is called right after instantiation before any other function calls.
     */
    initialize?(): void;

    /**
     * Destroy the repository. It's optional.
     *
     * This method is called right before the controller is going to be destroyed.
     */
    destroy?(): void;

    /**
     * Searches for a domain by an id
     *
     * @param id Id of the domain to search for
     * @param allowDeleted true, if domains marked as 'deleted' should be searched also
     * @returns Domain, if one was found, undefined otherwise
     */
    findById(id: string, allowDeleted?: true): Promise<Domain | undefined>;

    /**
     * Searches for a domain by a name
     *
     * @param name Name of the domain to search for
     * @param allowDeleted true, if domains marked as 'deleted' should be searched also
     * @returns Domain, if one was found, undefined otherwise
     */
    findByName(name: string, allowDeleted?: true): Promise<Domain | undefined>;

    /**
     * Gets one page of domains
     *
     * @param page page number, starting from 1
     * @param size page size
     * @param search search value for a name
     * @returns Page of domains sorted by name
     */
    getPage(page: number, size: number, search?: string): Promise<Domain[]>;

    /**
     * Gets a total count of domains
     * @param search search value for a host name
     */
    getCount(search?: string): Promise<number>;

    /**
     * Creates a new domain
     *
     * @param domain Domain data. If data contains an id value, it is assigned for a new domain.
     *               Otherwise, storage should generate the id
     * @returns Created domain
     */
    create(domain: Domain): Promise<Domain>;

    /**
     * Updates an existing domain
     *
     * @param domain Domain data
     * @param id Id of the domain to be updated
     * @returns Updated domain
     */
    update(domain: Domain): Promise<Domain>;

    /**
     * Deletes a domain
     *
     * @param id Id of the domain to be deleted
     * @returns True, if delete succeeded
     */
    delete(id: string): Promise<boolean>;
}

export default DomainRepository;
