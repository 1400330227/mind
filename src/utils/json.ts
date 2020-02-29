/**
 * 将JavaScript string 转为 JavaScript 对象
 * @param jsonStr
 */
export function string2json(jsonStr: string): any {
    if (typeof JSON == 'undefined') {
        return;
    }
    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        return null;
    }
}

/**
 * 将JavaScript对象转为json string
 * @param json JavaScript 对象
 */
export function json2string(json: any): string | void {
    if (typeof JSON === 'undefined') return;
    try {
        return JSON.stringify(json)
    } catch (e) {
        // logger.warn(e);
        // logger.warn('can not convert to string');
        return;
    }
}


