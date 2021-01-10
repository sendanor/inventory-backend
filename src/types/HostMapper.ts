// Copyright (c) 2020 Sendanor. All rights reserved.

import Host, { HostDto } from '../types/Host'

export default class HostMapper {
    public static toDto(host: Host): HostDto {
        return {
            id: host.id,
            domainId: host.domainId,
            name: host.name,
            data: host.data,
        }
    }

    public static toUpdatedHost(dto: HostDto, current: Host): Host {
        const host = { ...current }
        host.name = dto.name
        host.data = dto.data
        if (host.deleted) {
            host.createdTime = new Date()
            host.modifiedTime = undefined
            host.deleted = false
            host.deletedTime = undefined
        } else {
            host.modifiedTime = new Date()
        }
        return host
    }
}
