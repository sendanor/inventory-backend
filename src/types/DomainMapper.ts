// Copyright (c) 2020 Sendanor. All rights reserved.

import Domain, { DomainDto } from './Domain'

export default class DomainMapper {
    public static toDto(domain: Domain): DomainDto {
        return {
            id: domain.id,
            name: domain.name,
            data: domain.data,
        }
    }

    public static toUpdatedDomain(dto: DomainDto, current: Domain): Domain {
        const domain = { ...current }
        domain.name = dto.name
        domain.data = dto.data
        if (domain.deleted) {
            domain.createdTime = new Date()
            domain.modifiedTime = undefined
            domain.deleted = false
            domain.deletedTime = undefined
        } else {
            domain.modifiedTime = new Date()
        }
        return domain
    }
}
