export interface NotificationItem {
    _id: string;
    id?: string; // For backward compatibility
    title: {
      th: string;
      en: string;
    };
    subtitle: {
      th: string;
      en: string;
    };
    body?: {
      th: string;
      en: string;
    };
    detail?: {
      th: string;
      en: string;
    };
    icon: string;
    image: string;
    redirect?: {
      url: string;
      btnMessage: {
        th: string;
        en: string;
      };
    };
    timestamp?: string;
    createdAt?: string;
    updatedAt?: string;
    read?: boolean;
    isRead?: boolean;
    scope?: string;
  }
  