import Host from "../types/Host";
import {isEqual, isObject, isString} from "../modules/lodash";

export class HostUtils {

    public static isHost (host: any) : host is Host {
        // @ts-ignore
        return isObject(host) && isString(host?.name) && !!(host?.data);
    }

    public static areEqualHosts (current: Host, host: Host) : boolean {
        return !current.deleted && current.name === host.name && isEqual(current.data, host.data)
    }

}

export default HostUtils;
