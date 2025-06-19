export class PushNotificationDto {
  to: string[];
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'normal' | 'high' | undefined;
  badge?: number; //ios badge
}
