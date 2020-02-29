/**
 * 返回 XMLHttpRequest
 * @private
 */
import {string2json} from "./json";

/**
 * 返回 XMLHttpRequest 对象
 */
export function xhr(): XMLHttpRequest {
    if (typeof window.XMLHttpRequest === 'undefined') return new ActiveXObject('Microsoft.XMLHTTP');
    return new XMLHttpRequest();
}

/**
 * 把字符串作为 URI 组件进行编码
 * @param url 含有 URI 组件或其他要编码的文本
 */
export function encodeURI(url: string): string {
    return encodeURIComponent(url);
}

/**
 * 发送请求到服务器
 * @param url 服务器url
 * @param param 请求体
 * @param method 请求方法
 * @param callback 回调函数
 * @param fail_callback 失败回调函数
 */
export function request(url: any, param: { [propName: string]: any }, method: string = 'GET', callback: (data: any) => void, fail_callback?: (arg: XMLHttpRequest) => void) {

    const _xhr: XMLHttpRequest = xhr();
    if (!_xhr) return;

    let requestBody = '';
    const tmp_param: any[] = [];

    Object.keys(param).forEach(propName => tmp_param.push(`${encodeURI(propName)}=${encodeURI(param[propName])}`));
    if (tmp_param.length > 0) {
        requestBody = tmp_param.join('&');
    }
    _xhr.onreadystatechange = function () {
        if (_xhr.readyState === 4) {
            if (_xhr.status === 200 || _xhr.status === 0) {
                const data = string2json(_xhr.responseText);
                if (data) {
                    callback(data)
                }
            }
        } else {
            if (typeof fail_callback !== 'undefined') {
                fail_callback(_xhr)
            } else {
                console.error('xhr request failed.', _xhr)
            }
        }
    };

    _xhr.open(method, url, true);
    _xhr.setRequestHeader('If-Modified-Since', '0');

    if (method === 'POST') {
        _xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded;charset=utf-8');
        _xhr.send(requestBody)
    } else {
        _xhr.send();
    }
}

/**
 * 发送get请求
 * @param url 服务器请求url
 * @param callback 回调函数
 */
export function get(url: string, callback: (data: any) => void) {
    return request(url, {}, 'GET', callback)
}

/**
 * 发送post请求
 * @param url 请求 url
 * @param param 请求体
 * @param callback 回调函数
 */
export function post(url: any, param: { [propName: string]: any }, callback: (data: any) => void) {
    return request(url, param, 'POST', callback);
}

