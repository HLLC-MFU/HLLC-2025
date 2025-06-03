import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { Model, Types } from 'mongoose';
import { Expo } from 'expo-server-sdk';
import { queryAll, queryDeleteOne, queryFindOne, queryUpdateOne, queryUpdateOneByFilter } from 'src/pkg/helper/query.util';
import { NotificationRead, NotificationReadDocument } from './schemas/notification-reads.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { SseService } from '../sse/sse.service';
import { CreateNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(NotificationRead.name)
    private readonly notificationReadModel: Model<NotificationReadDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly sseService: SseService,
  ) {}

  async create(createNotificationDto: CreateNotificationDto) {
    let scope: 'global' | { id: Types.ObjectId[]; type: string }[] = 'global';

    if (createNotificationDto.scope !== 'global') {
      scope = createNotificationDto.scope.map((item) => ({
        ...item,
        id: item.id.map((id) => new Types.ObjectId(id)),
      }));
    }

    this.sseService.notify({
      type: 'REFETCH_NOTIFICATIONS',
    });

    return (await this.notificationModel.create({
      ...createNotificationDto,
      scope,
    })).toObject();
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
        body: typeof sendNotificationDto.body === 'string' ? sendNotificationDto.body : sendNotificationDto.body?.th ?? '',
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

  async getUserNotifications(userId: string, schoolId: string, majorId: string) {
    const userNotifications = await this.notificationModel.find({
      $or: [
        { scope: 'global' },
        { scope: 'school', targetId: new Types.ObjectId(userId) },
        { scope: 'major', targetId: new Types.ObjectId(schoolId) },
        { scope: 'individual', targetId: new Types.ObjectId(majorId) },
      ],
    }).sort({ createdAt: -1 }).lean();

    const readDocument = await this.notificationReadModel.findOne({ userId: userId }).lean();
    const readNotificationIds = (readDocument?.readNotifications ?? []).map((id) => id.toString());
    
    return userNotifications.map((notification) => ({
      ...notification,
      isRead: readNotificationIds.includes(notification._id.toString()),
    }));
  }

}