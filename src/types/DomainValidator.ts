// Copyright (c) 2020 Sendanor. All rights reserved.

import Domain from './Domain';

export default interface DomainValidator {
    (domain: Domain): Promise<Domain>
}
