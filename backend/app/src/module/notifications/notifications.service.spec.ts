import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { Notification, NotificationDocument } from './schemas/notification.schema';
import { NotificationRead, NotificationReadDocument } from './schemas/notification-reads.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { SseService } from '../sse/sse.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Model, Types } from 'mongoose';
import {
  queryAll,
  queryDeleteOne,
  queryFindOne,
  queryUpdateOne,
  queryUpdateOneByFilter,
} from 'src/pkg/helper/query.util';

jest.mock('src/pkg/helper/query.util', () => ({
  queryAll: jest.fn(),
  queryDeleteOne: jest.fn(),
  queryFindOne: jest.fn(),
  queryUpdateOne: jest.fn(),
  queryUpdateOneByFilter: jest.fn(),
}));

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationModel: jest.Mocked<Model<NotificationDocument>>;
  let notificationReadModel: jest.Mocked<Model<NotificationReadDocument>>;
  let userModel: jest.Mocked<Model<UserDocument>>;
  let sseService: SseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getModelToken(Notification.name),
          useValue: {
            create: jest.fn(),
            find: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            lean: jest.fn(),
            exists: jest.fn(),
          },
        },
        {
          provide: getModelToken(NotificationRead.name),
          useValue: {
            findOne: jest.fn().mockReturnThis(),
            lean: jest.fn(),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: {
            exists: jest.fn(),
          },
        },
        {
          provide: SseService,
          useValue: {
            notify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(NotificationsService);
    notificationModel = module.get(getModelToken(Notification.name));
    notificationReadModel = module.get(getModelToken(NotificationRead.name));
    userModel = module.get(getModelToken(User.name));
    sseService = module.get(SseService);
  });

  describe('create', () => {
    it('should create global notification', async () => {
      const dto: CreateNotificationDto = {
        title: { th: 'หัวข้อ', en: 'title' },
        subtitle: { th: 'หัวข้อย่อย', en: 'subtitle' },
        body: { th: 'โครงร่าง', en: 'bodey' },
        image: 'Wasan.png',
        icon: 'icon.png',
        scope: 'global',
      };
      const created = { ...dto, toObject: () => dto };
      (notificationModel.create as jest.Mock).mockResolvedValue(created);

      const result = await service.create(dto);
      expect(notificationModel.create).toHaveBeenCalled();
      expect(sseService.notify).toHaveBeenCalledWith({ type: 'REFETCH_NOTIFICATIONS' });
      expect(result).toEqual(dto);
    });
  });

  describe('markNotification', () => {
    it('should add to read list', async () => {

      const userId = new Types.ObjectId().toString();
      const notifId = new Types.ObjectId().toString();

      userModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });
      notificationModel.exists.mockResolvedValue({ _id: new Types.ObjectId() });
      (queryUpdateOneByFilter as jest.Mock).mockResolvedValue({});

      const result = await service.markNotification({
        userId,
        notificationId: notifId,
      }, true);

      expect(queryUpdateOneByFilter).toHaveBeenCalled();
      expect(result).toEqual({});
    });

    it('should throw if user not found', async () => {
      userModel.exists.mockResolvedValue(null);
      await expect(service.markNotification({
        userId: 'x',
        notificationId: 'y',
      }, true)).rejects.toThrow('User not found');
    });
  });

  describe('getUserNotifications', () => {
    it('should return notifications with isRead', async () => {
      const user = {
        _id: 'user123',
        metadata: {
          major: { _id: 'majorId', name: { th: 'สาขา A' } },
          school: { _id: 'schoolId', name: { th: 'โรงเรียน B' } },
        },
      };
      const notif = [{ _id: new Types.ObjectId(), scope: 'global' }];
      const readDoc = { readNotifications: [notif[0]._id] };

      (notificationModel.find().sort().lean as jest.Mock).mockResolvedValue(notif);
      (notificationReadModel.findOne().lean as jest.Mock).mockResolvedValue(readDoc);

      const result = await service.getUserNotifications(user);
      expect(result[0].isRead).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should call queryAll with correct model and query', async () => {
      const query = { scope: 'global' };
      const mockResult = { data: [], total: 0 };
      (queryAll as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.findAll(query);
      expect(queryAll).toHaveBeenCalledWith({ model: notificationModel, query });
      expect(result).toBe(mockResult);
    });
  });

  describe('findOne', () => {
    it('should call queryFindOne with id', async () => {
      const id = 'notif1';
      const mockResult = { _id: id };
      (queryFindOne as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.findOne(id);
      expect(queryFindOne).toHaveBeenCalledWith(notificationModel, { _id: id });
      expect(result).toBe(mockResult);
    });
  });

  describe('update', () => {
    it('should call queryUpdateOne with id and dto', async () => {
      const id = 'notif1';
      const updateDto = { title: { th: 'อัปเดต', en: 'Updated' } };
      const mockResult = { _id: id, ...updateDto };
      (queryUpdateOne as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.update(id, updateDto);
      expect(queryUpdateOne).toHaveBeenCalledWith(notificationModel, id, updateDto);
      expect(result).toBe(mockResult);
    });
  });

  describe('remove', () => {
    it('should call queryDeleteOne with id', async () => {
      const id = 'notif1';
      const mockResult = { deleted: true };
      (queryDeleteOne as jest.Mock).mockResolvedValue(mockResult);

      const result = await service.remove(id);
      expect(queryDeleteOne).toHaveBeenCalledWith(notificationModel, id);
      expect(result).toBe(mockResult);
    });
  });
});