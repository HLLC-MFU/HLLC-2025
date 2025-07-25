export type Role = {
  _id: string;
  name: string;
  permissions?: string[];
  metadataSchema?: MetadataSchema;
  metadata?: any;
};

export type MetadataSchema = {
  [key: string]: {
    type: string;
    label: string;
    required: boolean;
  };
};