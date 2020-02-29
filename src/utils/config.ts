/**
 * 属性装饰器，初始化属性值
 * @param target 目标属性
 * @param innerDefaultValue 初始值
 * @constructor 装饰器工厂
 */
export function WithConfig<T>(target: string, innerDefaultValue?: T) {
    return function ConfigDecorator(target: any, propName: any, originalDescriptor?: TypedPropertyDescriptor<T>) {
        const privatePropName = `$$__assignedValue__${propName}`;

        Object.defineProperty(target, privatePropName, {
            configurable: true,
            writable: true,
            enumerable: false
        });
        return {}
    }
}


export function uuid(): string {
    return (new Date().getTime().toString(16) + Math.random().toString(16).substr(2)).substr(2, 16);
}

export function isEmpty(str: string): boolean {
    if (!str) {
        return true;
    }
    return str.replace(/\s*/, '').length === 0;
}
