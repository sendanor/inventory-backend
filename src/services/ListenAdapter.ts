import {trim, isSafeInteger} from "../modules/lodash";
import Observable, {ObserverCallback, ObserverDestructor} from "./Observable";
import LogService from "./LogService";
import {IB_LISTEN_HOSTNAME, IB_LISTEN_PORT} from "../constants/env";

const LOG = LogService.createLogger('ListenAdapter');

const DEFAULT_PORT     = IB_LISTEN_PORT;
const DEFAULT_HOSTNAME = IB_LISTEN_HOSTNAME;

export enum ListenAdapterEvent {

    SERVER_LISTENING    = "serverListening",
    SERVER_CLOSING      = "serverClosing",
    SERVER_CLOSED       = "serverClosed",
    SERVER_DESTROYED    = "serverDestroyed"

}

export enum ListenType {

    TCP    = "TCP",
    SOCKET = "SOCKET"

}

/**
 * Interface for NodeJS object which uses [NodeJS's standard socket interface](https://nodejs.org/api/net.html#net_server_listen).
 */
export interface ListenableServer {

    listen (...args: Array<any>) : void;

    close (...args: Array<any>) : void;

}

export interface ListenCallback {
    () : void;
}

export interface ListenCloseCallback {
    () : void;
}

export class ListenAdapter {

    public static Event = ListenAdapterEvent;

    private _observer     : Observable<ListenAdapterEvent> | undefined;
    private _server       : ListenableServer | undefined;
    private _listenCalled : boolean;
    private _listening    : boolean;
    private _closing      : boolean;
    private _destroying   : boolean;

    private readonly _type           : ListenType;
    private readonly _hostname       : string | undefined;
    private readonly _port           : number | undefined;
    private readonly _path           : string | undefined;
    private readonly _listenCallback : ListenCallback;
    private readonly _closeCallback  : ListenCloseCallback;

    constructor (server: ListenableServer, url: string) {

        this._observer     = new Observable<ListenAdapterEvent>("ListenAdapter");
        this._server       = server;
        this._listenCalled = false;
        this._listening    = false;
        this._closing      = false;
        this._destroying   = false;

        const parsedConfigString : string = trim(url).toLowerCase();

        if ( parsedConfigString.startsWith('http:') || parsedConfigString.startsWith('https:') ) {

            const u = new URL(parsedConfigString);

            this._type     = ListenType.TCP;
            this._hostname = u?.hostname ?? DEFAULT_HOSTNAME;
            this._port     = ListenAdapter._parseInteger( u?.port ?? DEFAULT_PORT );

        } else if ( parsedConfigString.startsWith('socket:') || parsedConfigString.startsWith('unix:') ) {

            const u = new URL(parsedConfigString);

            this._type = ListenType.SOCKET;
            const pathname = u?.pathname ?? undefined;

            if (!pathname) {
                throw new TypeError(`Listening configuration for UNIX socket did not have path: "${url}"`);
            } else {
                this._path = pathname;
            }

        } else if ( /^[0-9]+$/.test(parsedConfigString) ) {

            this._type = ListenType.TCP;
            this._port = ListenAdapter._parseInteger(parsedConfigString);

        } else {
            throw new TypeError(`Listening configuration was unsupported: "${url}"`);
        }

        this._listenCallback = this._onListen.bind(this);
        this._closeCallback = this._onClose.bind(this);

    }

    public isListening () : boolean {
        return this._listening;
    }

    public isClosing () : boolean {
        return this._closing;
    }

    public isClosed () : boolean {
        return !this._listening;
    }

    public isDestroying () : boolean {
        return this._destroying;
    }

    public isDestroyed () : boolean {
        return !this._server || !this._observer;
    }

    private _onListen () {

        try {

            if (this.isDestroyed()) {
                LOG.warn('The object was already destroyed');
                return;
            }

            this._listening = true;

            // @ts-ignore
            this._observer.triggerEvent(ListenAdapterEvent.SERVER_LISTENING);

        } catch (err) {
            LOG.error('Error in onListen handler: ', err);
        }

    }

    private _onClose () {

        try {

            if (this.isDestroyed()) {
                LOG.warn('The object was already destroyed');
                return;
            }

            if (this.isClosed()) {
                LOG.warn('The object was already destroyed');
                return;
            }

            this._closing   = false;
            this._listening = false;

            // @ts-ignore
            this._observer.triggerEvent(ListenAdapterEvent.SERVER_CLOSED);

            if (this._destroying) {

                const observer = this._observer;

                this._server     = undefined;
                this._destroying = false;
                this._observer   = undefined;

                if (observer) {

                    observer.triggerEvent(ListenAdapterEvent.SERVER_DESTROYED);

                    observer.destroy();

                }

            }

        } catch (err) {
            LOG.error('Error in onClose handler: ', err);
        }

    }

    listen () {

        if (!this._server) throw new Error(`Cannot listen. The adapter was already destroyed.`);

        switch (this._type) {

            case ListenType.TCP:
                if (this._hostname !== undefined) {
                    this._listenCalled = true;
                    this._server.listen(this._port, this._hostname, this._listenCallback);

                } else {
                    this._listenCalled = true;
                    this._server.listen(this._port, this._listenCallback);
                }
                return;

            case ListenType.SOCKET:
                this._listenCalled = true;
                this._server.listen(this._path, this._listenCallback);
                return;

        }

        // If we get to this point, it is a bug in the software.
        throw new Error(`The listen type was not supported: ${this._type}`);

    }

    close () {

        if (!this._server) throw new Error(`The listener was already destroyed!`);

        if (!this._listening) throw new TypeError(`Cannot close. The server wasn't listening.`);
        if (this._closing) throw new TypeError(`Cannot close. The server was already closing.`);

        this._closing = true;

        this._server.close(this._closeCallback);

        if (this._observer) {
            this._observer.triggerEvent(ListenAdapterEvent.SERVER_CLOSING);
        }

    }

    destroy () {

        if ( !this._closing ) {
            this.close();
        }

    }

    public on (name : ListenAdapterEvent, callback : ObserverCallback<ListenAdapterEvent> ) : ObserverDestructor {
        if (!this._observer) throw new TypeError(`Cannot listen anything. The listener was already destroyed.`);
        return this._observer.listenEvent(name, callback);
    }

    private static _parseInteger (value: string) : number {

        const int : number = parseInt(value, 10);

        if (!isSafeInteger(int)) {
            throw new TypeError(`Value was not integer: "${value}"`);
        }

        return int;

    }

}

export default ListenAdapter;
