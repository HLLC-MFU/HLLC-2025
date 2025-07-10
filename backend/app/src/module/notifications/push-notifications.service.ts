import { BadRequestException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { KafkaService } from '../kafka/kafka.service';
import { PushNotificationDto } from './dto/push-notification.dto';
import type * as admin from 'firebase-admin';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Model, Types } from 'mongoose';
import { Device, DeviceDocument } from '../devices/schemas/device.schema';

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
  ) {}

  registerKafka() {
    this.kafka.registerHandler(
      'chat-notifications',
      this.handleChatNotification.bind(this)
    );
  }

  private handleChatNotification(payload: ChatNotificationPayload) {
    console.log('[Notification]', payload);
    // TODO: implement push-notification
  }

  async sendPushNotification(dto: PushNotificationDto, isDryRun?: boolean) {
    if (!this.firebaseApp) {
      throw new InternalServerErrorException('Firebase Admin is not initialized');
    }

    const tokens = new Set<string>();
    const userIds = new Set<string>();

    dto.receivers?.tokens?.forEach((token) => token && tokens.add(token));

    if (dto.receivers?.devices?.length) {
      const devices = await this.deviceModel.find({
        deviceId: { $in: dto.receivers.devices },
      });
      devices.forEach((device) => device.fcmToken && tokens.add(device.fcmToken));
    }

    dto.receivers?.users?.forEach((id) => userIds.add(id));

    if (dto.receivers?.schools?.length) {
      const users = await this.userModel
        .find({})
        .populate({
          path: 'metadata.major',
          model: 'Major',
          select: 'school',
        })
        .lean<Array<{
          _id: Types.ObjectId;
          metadata: {
            major?: {
              _id: Types.ObjectId;
              school?: string;
            };
          };
        }>>();

      users.forEach((user) => {
        const schoolId = user.metadata?.major?.school;
        if (schoolId && dto.receivers.schools?.includes(schoolId.toString())) {
          userIds.add(user._id.toString());
        }
      });
    }

    if (dto.receivers?.majors?.length) {
      const users = await this.userModel.find({
        'metadata.major': { $in: dto.receivers.majors },
      });
      users.forEach((user) => user._id && userIds.add(user._id.toString()));
    }

    if (dto.receivers?.roles?.length) {
      const users = await this.userModel.find({
        role: { $in: dto.receivers.roles.map((id) => new Types.ObjectId(id)) },
      });
      users.forEach((user) => user._id && userIds.add(user._id.toString()));
    }

    // TODO: Need to refactor ↓
    if (userIds.size > 0) {
      const userDevices = await this.deviceModel.find({
        userId: { $in: Array.from(userIds) },
      });
      userDevices.forEach((device) => device.fcmToken && tokens.add(device.fcmToken));
    }

     // TODO: Need to refactor ↓
    const allDevices = await this.deviceModel.find({
      fcmToken: { $in: Array.from(tokens) },
    }).lean();

    if (!allDevices.length) {
      // return;
      throw new BadRequestException('Not found any receivers (registered user). Try to send using in-app notification mode.');
    }

    const titleMap = dto.title;
    const bodyMap = dto.body;
    const badge = dto.badge ?? 1;

    const grouped = allDevices.reduce((acc, device) => {
      const lang = device.language || 'en';
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(device);
      return acc;
    }, {} as Record<string, typeof allDevices>);

    const messaging = this.firebaseApp.messaging();
    let successCount = 0;
    let failureCount = 0;
    const responses: admin.messaging.SendResponse[] = [];
    const MAX_TOKENS = 500;

    for (const [lang, deviceList] of Object.entries(grouped)) {
      const title = titleMap[lang] || titleMap['en'];
      const body = bodyMap[lang] || bodyMap['en'];

      for (let i = 0; i < deviceList.length; i += MAX_TOKENS) {
        const batch = deviceList.slice(i, i + MAX_TOKENS);
        const tokenBatch = batch.map((device) => device.fcmToken);
        
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
                // clickAction: 'OPEN_APP',
                // color: '#1976D2',
              },
            },
            apns: {
              payload: {
                aps: {
                  alert: { title, body },
                  badge,
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
