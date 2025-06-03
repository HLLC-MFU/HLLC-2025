/**
 * Converts fields like `style[primaryColor]` to nested objects:
 * { style: { primaryColor: value } }
 */
export function parseNestedField(target: any, fieldname: string, value: any): void {
    const keys = fieldname.match(/[^[\]]+/g);
    if (keys?.length === 2) {
        target[keys[0]] ??= {};
        target[keys[0]][keys[1]] = value;
    } else if (keys?.length === 1) {
        target[keys[0]] = value;
    } else {
        target[fieldname] = value;
    }
}