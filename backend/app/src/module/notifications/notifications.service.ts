import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Model, Types } from 'mongoose';
import { Expo } from 'expo-server-sdk';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne, queryUpdateOneByFilter } from 'src/pkg/helper/query.util';
import { NotificationRead, NotificationReadDocument } from './schemas/notification-reads.schema';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationRead.name)
    private readonly notificationReadModel: Model<NotificationReadDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(createNotificationDto: Notification) {

    if (createNotificationDto.scope !== 'global') {
      createNotificationDto.scope = createNotificationDto.scope.map((item) => ({
        ...item,
        id: item.id.map((id) => new Types.ObjectId(id))
      }));
    }

    return (await this.notificationModel.create(createNotificationDto)).toObject();
  }

  async findAll(query: Record<string, string>) {
    return queryAll<Notification>({
      model: this.notificationModel,
      query,
    });
  }

  async findOne(id: string) {
    return queryFindOne<Notification>(this.notificationModel, { _id: id });
  }

  async update(id: string, updateNotificationDto: Partial<Notification>) {
    return queryUpdateOne<Notification>(this.notificationModel, id, updateNotificationDto);
  }

  async remove(id: string) {
    return await queryDeleteOne<Notification>(this.notificationModel, id);
  }

  async markAsRead(userId: string, notificationId: string) {
    await this.checkUserExists(userId);
    await this.checkNotiExists(notificationId);

    const filter = { userId: new Types.ObjectId(userId) };
    const update = { $addToSet: { readNotifications: new Types.ObjectId(notificationId) } };
    const options = { upsert: true };

    return await queryUpdateOneByFilter<NotificationRead>(this.notificationReadModel, filter, update, options);
  }

  async markAsUnread(userId: string, notificationId: string) {
    await this.checkUserExists(userId);
    await this.checkNotiExists(notificationId);

    const filter = { userId: new Types.ObjectId(userId) };
    const update = { $pull: { readNotifications: new Types.ObjectId(notificationId) } };

    await queryUpdateOneByFilter<NotificationRead>(this.notificationReadModel, filter, update);
  }

  async sendNotification(sendNotificationDto: Notification) {
    const expo = new Expo();
    
    const messages = [
      {
        to: "",
        sound: 'default',
        title: sendNotificationDto.title.th,
        body: sendNotificationDto.body,
      },
    ];

    const ticketChunk = await expo.sendPushNotificationsAsync(messages);
    console.log('Push ticket:', ticketChunk);
  }

  private async checkUserExists(userId: string): Promise<void> {
    const exists = await this.userModel.exists({ _id: userId });
    if (!exists) throw new NotFoundException('User not found');
  }

  private async checkNotiExists(notiId: string): Promise<void> {
    const exists = await this.notificationModel.exists({ _id: notiId });
    if (!exists) throw new NotFoundException('Notification not found');
  }
}
