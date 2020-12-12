// Copyright (c) 2020 Sendanor. All rights reserved.

import LogService from "./LogService";
import ListenAdapter, {ListenableServer} from "./ListenAdapter";

const LOG = LogService.createLogger('HttpUtils');

export class HttpUtils {

    static createListenableServerAdapter (server : ListenableServer, value: string) : ListenAdapter {
        return new ListenAdapter(server, value);
    }

}
