import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";
import { transformBsonToJson } from "../helper/converter";

/**
 * Serializer Interceptor - Automatically transforms BSON objects to JSON-safe objects
 * Ensures ObjectId, Dates, and other MongoDB datatypes are properly serialized
 */
@Injectable()
export class SerializerInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(map((data) => transformBsonToJson(data)));
    }
}