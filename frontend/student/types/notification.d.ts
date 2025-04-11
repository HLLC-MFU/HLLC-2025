export interface NotificationItem {
    id: string;
    title: {
      th: string;
      en: string;
    };
    subtitle: {
      th: string;
      en: string;
    };
    detail: {
      th: string;
      en: string;
    };
    icon: string;
    image: string;
    redirect: {
      url: string;
      btnMessage: {
        th: string;
        en: string;
      };
    };
    timestamp: string;
    read: boolean;
  }
  