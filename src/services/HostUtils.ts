import Host, { HostDto } from "../types/Host";
import { isEqual, isString } from "../modules/lodash";

export class HostUtils {

    public static isHost(host: any): host is Host {

        // FIXME: Add rest of the non-optional properties to this check list

        // @ts-ignore
        return !!host && isString(host?.name) && !!(host?.data);

    }

    public static areEqualHostDtos(current: HostDto, host: HostDto): boolean {
        return current.name === host.name && isEqual(current.data, host.data)
    }

    public static areEqualHosts(current: Host, host: Host): boolean {
        return !current.deleted && current.name === host.name && isEqual(current.data, host.data)
    }

    public static areEqualHostsIncludingId(current: Host, host: Host): boolean {
        return HostUtils.isHost(current) && HostUtils.isHost(host) && current.id === host.id && HostUtils.areEqualHosts(current, host);
    }

}

export default HostUtils;
