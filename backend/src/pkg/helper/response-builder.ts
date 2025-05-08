import { Model } from "mongoose";

export interface BaseResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    meta?: Record<string, any>;
}
export async function buildResponse<T>(
    model: Model<any>,
    data: T[],
    message = 'Success'
  ): Promise<BaseResponse<T[]>> {
    const latest = await model
      .findOne()
      .sort({ updatedAt: -1 })
      .select('updatedAt')
      .lean() as { updatedAt?: Date };  // ✅ cast ตรงนี้
  
    const lastUpdatedAt = latest?.updatedAt?.toISOString() ?? new Date().toISOString();
  
    return {
      success: true,
      message,
      data,
      meta: {
        lastUpdatedAt,
      },
    };
}

export function buildError(
    message = 'Something went wrong',
    meta: Record<string, any> = {}
): BaseResponse<null> {
    return {
        success: false,
        message,
        data: null,
        meta,
    };
}
