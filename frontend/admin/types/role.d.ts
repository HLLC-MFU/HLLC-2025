export type Role = {
    name: string;
    permissions: string[];
    metadataSchema: MetadataSchema;
};

export type MetadataSchema = {
    major: {
        type: 'string' | 'number' | 'boolean' | 'date';
        label?: string;
        required?: boolean;
    }
};