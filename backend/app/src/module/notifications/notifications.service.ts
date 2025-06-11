import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Notification,
  NotificationDocument,
} from './schemas/notification.schema';
import { Model, Types } from 'mongoose';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
  queryUpdateOneByFilter,
} from 'src/pkg/helper/query.util';
import {
  NotificationRead,
  NotificationReadDocument,
} from './schemas/notification-reads.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { SseService } from '../sse/sse.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ReadNotificationDto } from './dto/read-notification.dto';
import { UserRequest } from 'src/pkg/types/users';

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

    return (
      await this.notificationModel.create({
        ...createNotificationDto,
        scope,
      })
    ).toObject();
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
    return queryUpdateOne<Notification>(
      this.notificationModel,
      id,
      updateNotificationDto,
    );
  }

  async remove(id: string) {
    return await queryDeleteOne<Notification>(this.notificationModel, id);
  }

  /**
   * Marks a notification as **read** or **unread** for a specific user.
   *
   * @param dto - DTO containing **userId** and **notificationId**.
   * @param read - boolean flag to mark as **read** or **unread**.
   * @returns Updated NotificationRead document.
   * @throws NotFoundException if the user or notification **does not exist**.
   */
  async markNotification(
    dto: ReadNotificationDto,
    read: boolean,
  ) {

    const userExists = await this.userModel.exists({ _id: dto.userId });
    if (!userExists) throw new NotFoundException('User not found');

    const notificationsExists = await this.notificationModel.exists({ _id: dto.notificationId });
    if (!notificationsExists) throw new NotFoundException('Notification not found');

    const filter = { userId: new Types.ObjectId(dto.userId) };
    const update = read
      ? { $addToSet: { readNotifications: new Types.ObjectId(dto.notificationId) } }
      : { $pull: { readNotifications: new Types.ObjectId(dto.notificationId) } };

    const options = read ? { upsert: true } : undefined;

    return await queryUpdateOneByFilter<NotificationRead>(
      this.notificationReadModel,
      filter,
      update,
      options,
    );
  }

  async getUserNotifications(user: UserRequest["user"]) {
    const userNotifications = await this.notificationModel
      .find({
        $or: [
          { scope: 'global' },
          { scope: 'major', targetId: user.metadata.major },
          { scope: 'school', targetId: user.metadata.school },
          { scope: 'individual', targetId: user._id },
        ],
      })
      .sort({ createdAt: -1 })
      .lean();

    const readDocument = await this.notificationReadModel
      .findOne({ userId: user._id })
      .lean();
    const readNotificationIds = (readDocument?.readNotifications ?? []).map(
      (id) => id.toString(),
    );

    return userNotifications.map((notification) => ({
      ...notification,
      isRead: readNotificationIds.includes(notification._id.toString()),
    }));
  }
}