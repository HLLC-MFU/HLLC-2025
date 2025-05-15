import { Types } from 'mongoose';


// Convert BSON ObjectId to String
export function transformBsonToJson(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (Array.isArray(obj)) {
        return obj.map(transformBsonToJson);
    } else if (obj instanceof Types.ObjectId) {
        return obj.toString();
    } else if (obj && typeof obj.toHexString === 'function') {
        return obj.toHexString();
    } else if (obj && typeof obj.toISOString === 'function') {
        return obj.toISOString();
    } else if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            result[key] = transformBsonToJson(obj[key]);
        }
        return result;
    } else {
        return obj;
    }
}