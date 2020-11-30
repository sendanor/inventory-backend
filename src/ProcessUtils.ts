import AssertUtils from "./AssertUtils";

const FS = require('fs');
const PATH = require('path');

export class ProcessUtils {

    static parseEnvFileLine (obj : Record<string, string>, line : string) : Record<string, string> {

        AssertUtils.isObject(obj);
        AssertUtils.isString(line);

        if (line.indexOf('=') < 0) {
            if (line.length) {
                obj[line] = '';
            }
            return obj;
        }

        const parts = line.split('=');
        let key = parts.shift();
        AssertUtils.isString(key);
        key = key.trim();
        if (key.length) {
            obj[key] = parts.join('=').trim();
        }
        return obj;

    }

    static parseEnvFile (file: string) : Record<string, string> {

        const input : string = FS.readFileSync(file, {encoding:"utf-8"});

        AssertUtils.isString(input);

        const rows : Array<string> = input.split('\n');

        AssertUtils.isArray(rows);

        return rows.reduce(ProcessUtils.parseEnvFileLine, {});

    }

    static initEnvFromFile (file: string) {

        const params = ProcessUtils.parseEnvFile(file);

        AssertUtils.isObject(params);

        process.env = {
            ...params,
            ...process.env
        };

    }

    static initEnvFromDefaultFiles () {

        const file = PATH.join(process.cwd(), '.env');

        ProcessUtils.initEnvFromFile(file);

    }

}

export default ProcessUtils;
