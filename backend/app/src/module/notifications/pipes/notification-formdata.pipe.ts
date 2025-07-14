import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

type JsonFields = 'title' | 'subtitle' | 'body' | 'redirectButton' | 'scope';
type BooleanFields = 'isDryRun';
type EnumFields = 'mode';

type PartialFormPayload = {
  [key in JsonFields | BooleanFields | EnumFields]?: string | object | boolean;
} & Record<string, any>;

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
          value[field] = JSON.parse(value[field] as string);
        } catch (err) {
          throw new BadRequestException(`Invalid JSON in field: ${field}`);
        }
      }
    }

    if (typeof value.isDryRun === 'string') {
      value.isDryRun = value.isDryRun.toLowerCase() === 'true';
    }

    const validModes = ['both', 'push', 'in_app'];
    if (typeof value.mode === 'string' && !validModes.includes(value.mode)) {
      throw new BadRequestException(`Invalid mode value: ${value.mode}`);
    }

    return value;
  }
}
