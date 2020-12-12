// Copyright (c) 2020 Sendanor. All rights reserved.

import {trim} from "../modules/lodash";
import InventoryLogLevel from "../types/InventoryLogLevel";

export class LogUtils {

    public static parseLogLevelString (value: string) : InventoryLogLevel {

        switch (trim(value).toUpperCase()) {
            case 'DEBUG' : return InventoryLogLevel.DEBUG;
            case 'INFO'  : return InventoryLogLevel.INFO;
            case 'WARN'  : return InventoryLogLevel.WARN;
            case 'ERROR' : return InventoryLogLevel.ERROR;
        }

        throw new TypeError(`The log level "${value}" was not valid log level.`);

    }

}

export default LogUtils;
