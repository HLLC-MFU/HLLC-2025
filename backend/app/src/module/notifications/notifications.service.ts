import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Model, Types } from 'mongoose';
import { Expo } from 'expo-server-sdk';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne } from 'src/pkg/helper/query.util';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>
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
}
