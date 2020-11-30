
export class Test {

    static isString (value: any) : boolean {
        return typeof value === 'string';
    }

    static isObject (value: any) : boolean {
        return value && typeof value === 'object' && !(value instanceof Array);
    }

    static isArray (value: any) : value is Array<any> {
        return value && typeof value === 'object' && value instanceof Array;
    }

    static isPromise (value: any) : value is Promise<any> {
        return !!value && !!value.then && !!value.catch;
    }

}

export class AssertUtils {

    /**
     * Use AssertUtils.isEqual()
     *
     * @deprecated
     * @param value1
     * @param value2
     */
    public static equals (value1, value2) {

        if (value1 !== value2) {
            throw new TypeError('Values were not equal: '+ value1 + ' !== ' + value2);
        }

    }

    public static isEqual (value1, value2) {

        if (value1 !== value2) {
            throw new TypeError('Values were not equal: '+ value1 + ' !== ' + value2);
        }

    }

    public static notEqual (value1, value2) {

        if (value1 === value2) {
            throw new TypeError('Values were equal: '+ value1 + ' === ' + value2);
        }

    }

    public static isLessThanOrEqual (value1, value2) {

        if (!(value1 <= value2)) {
            throw new TypeError('Value is not less than or equal: !('+ value1 + ' <= ' + value2 + ')');
        }

    }

    public static isLessThan (value1, value2) {

        if (!(value1 < value2)) {
            throw new TypeError('Value is not less than or equal: !('+ value1 + ' < ' + value2 + ')');
        }

    }

    public static isTrue (value : any) {

        if (value !== true) {
            throw new TypeError('Value was not true: '+ value);
        }

    }

    public static notTrue (value : any) {

        if (value === true) {
            throw new TypeError('Value was true: '+ value);
        }

    }

    public static isFalse (value : any) {

        if (value !== false) {
            throw new TypeError('Value was not false: '+ value);
        }

    }

    public static notFalse (value : any) {

        if (value === false) {
            throw new TypeError('Value was false: '+ value);
        }

    }

    public static isObject (value : any) {

        if (!Test.isObject(value)) {
            throw new TypeError('Value was not object: ' + value);
        }

    }

    public static notObject (value : any) {

        if (Test.isObject(value)) {
            throw new TypeError('Value was object: ' + value);
        }

    }

    public static isString (value : any) {

        if (!Test.isString(value)) {
            throw new TypeError('Value was not string: ' + value);
        }

    }

    public static notString (value : any) {

        if (Test.isString(value)) {
            throw new TypeError('Value was string: ' + value);
        }

    }

    public static isArray (value : any) {

        if (!Test.isArray(value)) {
            throw new TypeError('Value was not array: ' + value);
        }

    }

    public static notArray (value : any) {

        if (Test.isArray(value)) {
            throw new TypeError('Value was array: ' + value);
        }

    }

    public static isPromise (value : any) {

        if (!Test.isPromise(value)) {
            throw new TypeError('Value was not promise: ' + value);
        }

    }

    public static notPromise (value : any) {

        if (Test.isPromise(value)) {
            throw new TypeError('Value was promise: ' + value);
        }

    }

}

export default AssertUtils;
