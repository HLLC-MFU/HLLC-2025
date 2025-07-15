type PushNotificationResult = {
  successCount: number;
  failureCount: number;
  responses: admin.messaging.SendResponse[];
};