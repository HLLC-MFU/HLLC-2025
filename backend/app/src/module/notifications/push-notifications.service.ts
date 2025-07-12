import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { PushNotificationDto } from './dto/push-notification.dto';
import type * as admin from 'firebase-admin';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Device, DeviceDocument } from '../devices/schemas/device.schema';
import { Major, MajorDocument } from '../majors/schemas/major.schema';
import { getUsersByMajors, getUsersByRoles, getUsersBySchools } from './utils/notification.util';
import { ChatNotificationPayload } from 'src/pkg/types/kafka';

@Injectable()
export class PushNotificationService {
  constructor(
    private readonly kafka: KafkaService,
    @Inject('FIREBASE_ADMIN')
    private readonly firebaseApp: admin.app.App,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Device.name)
    private readonly deviceModel: Model<DeviceDocument>,
    @InjectModel(Major.name)
    private readonly majorModel: Model<MajorDocument>,
  ) {}

  registerKafka() {
    this.kafka.registerHandler(
      'chat-notifications',
      this.handleChatNotification.bind(this)
    );
  }

  private async handleChatNotification(payload: ChatNotificationPayload) {
    const dto: PushNotificationDto = {
      receivers: {
        users: [payload.receiver],
      },
      title: {
        th: `${payload.sender.name.first} ${payload.sender.name.middle} ${payload.sender.name.last}`,
        en: `${payload.sender.name.first} ${payload.sender.name.middle} ${payload.sender.name.last}`,
      },
      subtitle: {
        th: `${payload.room.name.th}`,
        en: `${payload.room.name.en}`,
      },
      body: {
        th: payload.message.message,
        en: payload.message.message,
      },
      data: {
        type: 'chat',
        roomId: payload.room._id,
        messageId: payload.message._id,
        senderId: payload.sender._id,
      },
      priority: 'high',
      badge: 1,
    };

    await this.sendPushNotification(dto);
  }

  async sendPushNotification(dto: PushNotificationDto, isDryRun?: boolean) {
    if (!this.firebaseApp) {
      throw new InternalServerErrorException('Firebase Admin is not initialized');
    }

    let devices: DeviceDocument[] = [];

    if (dto.receivers === 'global') {

      devices = await this.deviceModel.find({
        fcmToken: { $ne: null },
      }).lean();

    } else {

      const tokensFromDto = dto.receivers?.tokens || [];
      const devicesFromDto = dto.receivers?.devices || [];
      const userIds = new Set<string>();

      dto.receivers?.users?.forEach(id => userIds.add(id));

      const roleUsers = await getUsersByRoles(this.userModel, dto.receivers?.roles || []);
      roleUsers.forEach(id => userIds.add(id));

      const majorUsers = await getUsersByMajors(this.userModel, dto.receivers?.majors || []);
      majorUsers.forEach(id => userIds.add(id));

      const schoolUsers = await getUsersBySchools(this.majorModel, this.userModel, dto.receivers?.schools || []);
      schoolUsers.forEach(id => userIds.add(id));

      devices = await this.deviceModel.find({
        $or: [
          { deviceId: { $in: devicesFromDto } },
          { userId: { $in: Array.from(userIds) } },
          { fcmToken: { $in: tokensFromDto } },
        ],
        fcmToken: { $ne: null },
      }).lean();
      
    }

    if (!devices.length) {
      return {
        successCount: 0,
        failureCount: 0,
        responses: [],
      };
    }

    const grouped = devices.reduce((acc, device) => {
      const lang = device.language || 'en';
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(device);
      return acc;
    }, {} as Record<string, typeof devices>);

    const messaging = this.firebaseApp.messaging();
    let successCount = 0;
    let failureCount = 0;
    const responses: admin.messaging.SendResponse[] = [];
    const MAX_TOKENS = 500;

    for (const [lang, deviceList] of Object.entries(grouped)) {
      const title = dto.title[lang] || dto.title['en'];
      const body = dto.body[lang] || dto.body['en'];
      const subtitle = dto.subtitle?.[lang] || dto.subtitle?.['en'];

      for (let i = 0; i < deviceList.length; i += MAX_TOKENS) {
        const tokenBatch = devices.slice(i, i + MAX_TOKENS).map(device => device.fcmToken);
        
        const response = await messaging.sendEachForMulticast(
          {
            tokens: tokenBatch,
            notification: {
              title,
              body,
              imageUrl: dto.image ? `${process.env.BASE_URL}/api/uploads/${dto.image}` : undefined,
            },
            android: {
              priority: dto.priority ?? 'normal',
              notification: {
                sound: 'default',
              },
            },
            apns: {
              payload: {
                aps: {
                  alert: { 
                    title,
                    body ,
                    ...(subtitle && { subtitle }), 
                  },
                  badge: dto.badge ?? 1,
                  sound: 'default',
                },
              },
            },
            // data: dto.data ? flattenData(dto.data) : undefined,
          },
          isDryRun,
        );

        const failedTokens = tokenBatch.filter((token, idx) => {
          const resp = response.responses[idx];
          return (
            !resp.success &&
            ['messaging/invalid-registration-token', 'messaging/registration-token-not-registered'].includes(
              resp.error?.code || '',
            )
          );
        });

        if (failedTokens.length) {
          await this.deviceModel.deleteMany({ fcmToken: { $in: failedTokens } });
        }

        successCount += response.successCount;
        failureCount += response.failureCount;
        responses.push(...response.responses);
      }
    }

    return {
      successCount,
      failureCount,
      responses,
    };
  }
}
