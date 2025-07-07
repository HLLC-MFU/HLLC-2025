export class PushNotificationDto {
  receivers: {
    tokens?: string[];
    devices?: string[];
    users?: string[];
    schools?: string[];
    majors?: string[];
    roles?: string[];
  }
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: 'normal' | 'high' | undefined;
  badge?: number;
}
