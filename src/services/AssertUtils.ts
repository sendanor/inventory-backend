// Copyright (c) 2020 Sendanor. All rights reserved.

import {
    isString,
    isObject,
    isArray
} from "../modules/lodash";

export class Test {

    static isString (value: any) : boolean {
        return isString(value);
    }

    /**
     * Test if it is an regular object.
     *
     * @param value
     */
    static isObject (value: any) : boolean {
        return isObject(value) && !isArray(value);
    }

    /**
     * Test if the value is an array
     *
     * @param value
     */
    static isArray (value: any) : value is Array<any> {
        return isArray(value);
    }

    static isPromise (value: any) : value is Promise<any> {
        // @ts-ignore
        return isObject(value) && !!value.then && !!value.catch;
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
    public static equals (value1 : any, value2 : any) {

        if (value1 !== value2) {
            throw new TypeError('Values were not equal: '+ value1 + ' !== ' + value2);
        }

    }

    public static isEqual (value1  : any, value2 : any) {

        if (value1 !== value2) {
            throw new TypeError('Values were not equal: '+ value1 + ' !== ' + value2);
        }

    }

    public static notEqual (value1 : any, value2 : any) {

        if (value1 === value2) {
            throw new TypeError('Values were equal: '+ value1 + ' === ' + value2);
        }

    }

    public static isLessThanOrEqual (value1 : number, value2 : number) {

        if (!(value1 <= value2)) {
            throw new TypeError('Value is not less than or equal: !('+ value1 + ' <= ' + value2 + ')');
        }

    }

    public static isLessThan (value1 : number, value2 : number) {

        if (!(value1 < value2)) {
            throw new TypeError('Value is not less than or equal: !('+ value1 + ' < ' + value2 + ')');
        }

    }

    public static isTrue (value : boolean| undefined) {

        if (value !== true) {
            throw new TypeError('Value was not true: '+ value);
        }

    }

    public static notTrue (value : boolean| undefined) {

        if (value === true) {
            throw new TypeError('Value was true: '+ value);
        }

    }

    public static isFalse (value : boolean| undefined) {

        if (value !== false) {
            throw new TypeError('Value was not false: '+ value);
        }

    }

    public static notFalse (value : boolean| undefined) {

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

    public static isString (value : string | undefined) {

        if (!Test.isString(value)) {
            throw new TypeError('Value was not string: ' + value);
        }

    }

    public static notString (value : string | undefined) {

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
