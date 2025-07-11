import { Lang } from './lang';

export type Target = {
  type: 'school' | 'major' | 'user';
  id: string[];
};

export type Notification = {
  _id?: string;
  title: Lang;
  subtitle: Lang;
  body: Lang;
  icon: string;
  image?: File;
  redirectButton?: {
    label: Lang;
    url: string;
  };
  scope: 'global' | Target[];
};

export type PushNotificationResult = {
  successCount: number;
  failureCount: number;
  responses: admin.messaging.SendResponse[];
};