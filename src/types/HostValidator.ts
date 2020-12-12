// Copyright (c) 2020 Sendanor. All rights reserved.

import Host from './Host';

export default interface HostValidator {
    (host: Host): Promise<Host>
}
