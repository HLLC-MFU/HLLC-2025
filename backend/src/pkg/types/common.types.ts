// src/pkg/types/common.types.ts

/**
 * ใช้สำหรับแทน filters ทั่วไปที่มี key เป็น string และ value เป็นอะไรก็ได้แบบจำกัด
 */
export type FilterMap<T = any> = {
    [key: string]: T;
  };
  
  /**
   * ใช้สำหรับ metadata ที่ key เป็น string และ value สามารถเป็น object หรือ primitive ได้
   */
  export type MetadataMap = Record<string, string | number | boolean | object | null | undefined>;
  
  /**
   * ใช้กับ object ที่ต้องการเก็บเป็น key-value แบบมี id
   */
  export type EntityMap<T> = Record<string, T>;

  // common.types.ts หรือภายในไฟล์เดียวกันก็ได้
export type QueryWithPagination<T = Record<string, string>> = {
  page?: string;
  limit?: string;
  excluded?: string;
} & T;

  