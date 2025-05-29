import * as fs from 'fs';
import * as path from 'path';

export const UPLOAD_DIR = path.resolve('uploads');

export function ensureUploadDirExists() {
    if (!fs.existsSync(UPLOAD_DIR)) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
}

export function generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const safeName = originalName.replace(/\s+/g, '-');
    return `${timestamp}-${safeName}`;
}

export function saveFileToUploadDir(filename: string, buffer: Buffer): string {
    ensureUploadDirExists();
    const fullPath = path.join(UPLOAD_DIR, filename);
    fs.writeFileSync(fullPath, buffer);
    return filename;
}
