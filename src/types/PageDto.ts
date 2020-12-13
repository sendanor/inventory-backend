// Copyright (c) 2020 Sendanor. All rights reserved.

export default interface PageDto<T> {
    entities: T[]
    pageNumber: number
    pageSize: number
    pageCount: number
    totalCount: number
}
