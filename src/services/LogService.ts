import InventoryLogLevel from "../types/InventoryLogLevel";
import {IB_LOG_LEVEL} from "../constants/env";

export class Logger {

    readonly name : string;

    constructor (name : string) {
        this.name = name;
    }

    public debug (...args : Array<any>) {
        LogService.debug(`[${this.name}]`, ...args);
    }

    public info (...args : Array<any>) {
        LogService.info(`[${this.name}]`, ...args);
    }

    public warn (...args : Array<any>) {
        LogService.warn(`[${this.name}]`, ...args);
    }

    public error (...args : Array<any>) {
        LogService.error(`[${this.name}]`, ...args);
    }

}

export class LogService {

    private static _level  : InventoryLogLevel = IB_LOG_LEVEL;
    private static _logger : any = console;

    public static setLogLevel (value : InventoryLogLevel) {
        this._level = value;
    }

    public static setLogger (value : any) {
        if (!value) throw new TypeError(`The logger was not defined`);
        this._logger = value;
    }

    public static debug (...args : Array<any>) {
        if (this._level <= InventoryLogLevel.DEBUG) {
            this._logger.debug(...args);
        }
    }

    public static info (...args : Array<any>) {
        if (this._level <= InventoryLogLevel.INFO) {
            this._logger.info(...args);
        }
    }

    public static warn (...args : Array<any>) {
        if (this._level <= InventoryLogLevel.WARN) {
            this._logger.warn(...args);
        }
    }

    public static error (...args : Array<any>) {
        if (this._level <= InventoryLogLevel.ERROR) {
            this._logger.error(...args);
        }
    }

    public static createLogger (name : string) : Logger {
        return new Logger(name);
    }

}

export default LogService;
