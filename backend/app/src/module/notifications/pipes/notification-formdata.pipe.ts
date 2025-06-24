import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

type JsonFields = 'title' | 'subtitle' | 'body' | 'redirectButton' | 'scope';

type PartialFormPayload = Partial<Record<JsonFields, string | object>> &
  Record<string, any>;

@Injectable()
export class NotificationFormDataPipe implements PipeTransform {
  transform(value: PartialFormPayload) {
    const parseFields: JsonFields[] = [
      'title',
      'subtitle',
      'body',
      'redirectButton',
      'scope',
    ];

    for (const field of parseFields) {
      if (typeof value?.[field] === 'string') {
        try {
          value[field] = JSON.parse(value[field]);
        } catch (err) {
          throw new BadRequestException(`Invalid JSON in field: ${field}`);
        }
      }
    }

    return value;
  }
}
