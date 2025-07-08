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

  async sendPushNotification(dto: PushNotificationDto, isDryRun: boolean) {
    if (!this.firebaseApp) throw new InternalServerErrorException('Firebase Admin is not initialized');

    const tokens = new Set<string>();
    const userIds = new Set<string>();

    dto.receivers?.tokens?.forEach(token => token && tokens.add(token));

    if (dto.receivers?.devices?.length) {
      const devices = await this.deviceModel.find({
        deviceId: { $in: dto.receivers.devices },
      });
      devices.forEach(device => device.fcmToken && tokens.add(device.fcmToken));
    }

    dto.receivers?.users?.forEach(id => userIds.add(id));

    if (dto.receivers?.schools?.length) {
      const users = await this.userModel
        .find({})
        .populate({
          path: 'metadata.major',
          model: 'Major',
          populate: {
            path: 'school',
            model: 'School',
          },
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

      users.forEach(user => {
        const schoolId = user?.metadata?.major?.school;

        if (schoolId && dto.receivers.schools?.includes(schoolId)) {
          userIds.add(user._id.toString());
        }
      });
    }    

    if (dto.receivers?.majors?.length) {
      const users = await this.userModel.find({
        'metadata.major': { $in: dto.receivers.majors },
      });

      users.forEach(user => {
        user._id && userIds.add(user._id.toString());
      });
    }

    if (dto.receivers?.roles?.length) {
      const users = await this.userModel.find({
        role: { $in: dto.receivers.roles.map((id) => new Types.ObjectId(id)) },
      });

      users.forEach(user => {
        user._id && userIds.add(user._id.toString());
      });
    }

    if (userIds.size > 0) {
      const devices = await this.deviceModel.find({
        userId: { $in: Array.from(userIds) },
      });
      devices.forEach(device => device.fcmToken && tokens.add(device.fcmToken));
    }

    const tokenList = Array.from(tokens).filter(Boolean);
    if (tokenList.length === 0) throw new BadRequestException('Not found any receivers');

    const messaging = this.firebaseApp.messaging();

    const response = await messaging.sendEachForMulticast({
      tokens: tokenList,
      notification: {
        title: dto.title,
        body: dto.body,
      },
      android: {
        priority: dto.priority ?? 'high',
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: dto.title,
              body: dto.body,
            },
            badge: 1,
            sound: 'default',
          },
        },
      },
      // data: dto.data ? flattenData(dto.data) : undefined,
    }, isDryRun);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      responses: response.responses,
    };
  }
}
