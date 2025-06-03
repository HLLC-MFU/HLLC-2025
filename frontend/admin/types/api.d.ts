type ApiResponse<T> = {
  statusCode: number;
  message: string | null;
  data: T;
};