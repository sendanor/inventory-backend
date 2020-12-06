import Host from "../types/Host";
import {isEqual, isObject, isString} from "../modules/lodash";

export class HostUtils {

    public static isHost (host: any) : host is Host {

        // FIXME: Add rest of the non-optional properties to this check list

        // @ts-ignore
        return !!host && isString(host?.name) && !!(host?.data);

    }

    public static areEqualHosts (current: Host, host: Host) : boolean {
        return !current.deleted && current.name === host.name && isEqual(current.data, host.data)
    }

    public static areEqualHostsIncludingId (current: Host, host: Host) : boolean {
        return isHost(current) && isHost(host) && current.id === host.id && this.areEqualHosts(host);
    }

}

export default HostUtils;
