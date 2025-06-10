import { BadRequestException } from '@nestjs/common';

export function validateActivityDates(startAt?: Date, endAt?: Date) {
  if (startAt && endAt) {
    const start = new Date(startAt);
    const end = new Date(endAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Invalid date format for startAt or endAt');
    }

    if (start >= end) {
      throw new BadRequestException('startAt must be before endAt');
    }
  }
}
