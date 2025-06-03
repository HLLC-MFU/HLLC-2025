type NestedObject = {
    [key: string]: string | number | boolean | NestedObject
};

export function parseNestedField(obj: NestedObject, path: string, value: string): void {
    const keys = path.match(/[^[\]]+/g);
    if (!keys) {
        obj[path] = value;
        return;
    }

    let target = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!target[key] || typeof target[key] !== 'object') {
            target[key] = {};
        }
        target = target[key] as NestedObject;
    }

    const lastKey = keys[keys.length - 1];
    try {
        // Try to parse as JSON if it's a string that looks like an object or array
        if (typeof value === 'string' && (value.startsWith('{') || value.startsWith('['))) {
            target[lastKey] = JSON.parse(value);
        } else {
            target[lastKey] = value;
        }
    } catch {
        // If JSON parsing fails, use the raw value
        target[lastKey] = value;
    }
} 