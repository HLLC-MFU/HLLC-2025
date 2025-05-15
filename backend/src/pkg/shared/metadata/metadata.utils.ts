import { MetadataKey } from './metadata.types';

// Build Timestamp Key
export function buildTimestampKey(key: MetadataKey): string {
    // Return Timestamp Key
    return `metadata:${key}_last_updated`;
}

// Build Cache Key
export function buildCacheKey(key: MetadataKey): string {
    // Return Cache Key
    return `metadata:${key}`;
}
