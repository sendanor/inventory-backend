// Copyright (c) 2020 Sendanor. All rights reserved.

import Domain from './types/Domain';
import DomainValidator from './types/DomainValidator'

let validate: DomainValidator;
validate = function (domain: Domain): Promise<Domain> { return Promise.resolve(domain) }
export default validate
