export class PushNotificationDto {
  to: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'default' | 'normal' | 'high';
  badge?: number; //ios badge
}
