export type Role = {
    name: string;
    permissions?: string[];
    metadataSchema?: MetadataSchema;
};

export type MetadataSchema = {
  [key: string]: {
    type: string;
    label: string;
    required: boolean;
  };
};