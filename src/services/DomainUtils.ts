// Copyright (c) 2020 Sendanor. All rights reserved.

import Domain, { DomainDto } from "../types/Domain";
import { isEqual, isString } from "../modules/lodash";

export class DomainUtils {

    public static isDomain(domain: any): domain is Domain {

        // FIXME: Add rest of the non-optional properties to this check list

        // @ts-ignore
        return !!domain && isString(domain?.name) && !!(domain?.data);

    }

    public static areEqualDomainDtos(current: DomainDto, domain: DomainDto): boolean {
        return current.name === domain.name && isEqual(current.data, domain.data)
    }

    public static areEqualDomains(current: Domain, domain: Domain): boolean {
        return !current.deleted && current.name === domain.name && isEqual(current.data, domain.data)
    }

    public static areEqualDomainsIncludingId(current: Domain, domain: Domain): boolean {
        return DomainUtils.isDomain(current) && DomainUtils.isDomain(domain) && current.id === domain.id && DomainUtils.areEqualDomains(current, domain);
    }

}

export default DomainUtils;
