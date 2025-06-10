import { format } from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

const THAI_TIMEZONE = 'Asia/Bangkok';

export function toThaiTime(date: Date | string): Date {
  const utcDate = new Date(date);
  return toZonedTime(utcDate, THAI_TIMEZONE);
}

export function fromThaiTime(date: Date | string): Date {
  return fromZonedTime(new Date(date), THAI_TIMEZONE);
}

export function isExpired(expirationDate: Date | string): boolean {
  const now = toThaiTime(new Date());
  const expiration = toThaiTime(expirationDate);
  return now > expiration;
} 