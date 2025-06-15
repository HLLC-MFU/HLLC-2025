import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { ReadNotificationDto } from './dto/read-notification.dto';
import { PushNotificationDto } from './dto/push-notification.dto';
import { UserRequest } from 'src/pkg/types/users';
import { FastifyRequest } from 'fastify/types/request';

interface MockUserRequest extends Partial<Omit<UserRequest, 'user'>> {
  user: {
    _id: string;
    metadata: {
      major: {
        _id: string;
        name: Record<string, string>;
      };
      school: {
        _id: string;
        name: Record<string, string>;
      };
    };
  };
}

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let notificationsService: NotificationsService;
  let pushNotificationService: PushNotificationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            markNotification: jest.fn(),
            getUserNotifications: jest.fn(),
          },
        },
        {
          provide: PushNotificationService,
          useValue: {
            sendPushNotification: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<NotificationsController>(NotificationsController);
    notificationsService = module.get<NotificationsService>(NotificationsService);
    pushNotificationService = module.get<PushNotificationService>(PushNotificationService);
  });

  describe('POST /notifications', () => {
    it('should create a notification', async () => {
      const dto: CreateNotificationDto = {
        title: { th: '', en: '' },
        subtitle: { th: '', en: '' },
        body: { th: '', en: '' },
        icon: '',
        scope: 'global',
      };
      const req = { body: dto } as FastifyRequest;
      await controller.create(req);
      expect(notificationsService.create).toHaveBeenCalledWith(dto);
    });
  });

  describe('GET /notifications', () => {
    it('should return all notifications', async () => {
      await controller.findAll({});
      expect(notificationsService.findAll).toHaveBeenCalled();
    });

    it('should return one notification', async () => {
      await controller.findOne('notifId');
      expect(notificationsService.findOne).toHaveBeenCalledWith('notifId');
    });
  });

  describe('PATCH /notifications/:id', () => {
    it('should update a notification', async () => {
      const updateDto = { title: { th: 'อัปเดต', en: 'update' } };
      await controller.update('notifId', updateDto);
      expect(notificationsService.update).toHaveBeenCalledWith('notifId', updateDto);
    });
  });

  describe('DELETE /notifications/:id', () => {
    it('should delete a notification', async () => {
      await controller.remove('notifId');
      expect(notificationsService.remove).toHaveBeenCalledWith('notifId');
    });
  });

  describe('POST /notifications/read + /unread', () => {
    it('should mark notification as read', async () => {
      const dto: ReadNotificationDto = { userId: 'user1', notificationId: 'notif1' };
      await controller.markAsRead(dto);
      expect(notificationsService.markNotification).toHaveBeenCalledWith(dto, true);
    });

    it('should mark notification as unread', async () => {
      const dto: ReadNotificationDto = { userId: 'user1', notificationId: 'notif1' };
      await controller.markAsUnread(dto);
      expect(notificationsService.markNotification).toHaveBeenCalledWith(dto, false);
    });
  });

  describe('GET /notifications/me', () => {
    it('should get user notifications', async () => {
      const mockReq: MockUserRequest = {
        user: {
          _id: 'user1',
          metadata: {
            major: {
              _id: 'majorId',
              name: { th: 'วิศวกรรมศาสตร์', en: 'Engineering' },
            },
            school: {
              _id: 'schoolId',
              name: { th: 'โรงเรียน A', en: 'School A' },
            },
          },
        },
      };

      await controller.getMyNotifications(mockReq as UserRequest);
      expect(notificationsService.getUserNotifications).toHaveBeenCalledWith(mockReq.user);
    });
  });

  describe('POST /notifications/push', () => {
    it('should send push notification', async () => {
      const dto: PushNotificationDto = {
        to: ['token1', 'token2'],
        title: 'Test Title',
        body: 'Test Body',
        data: { key: 'value' },
        priority: 'high',
        badge: 1,
      };

      await controller.sendPushNotification(dto);
      expect(pushNotificationService.sendPushNotification).toHaveBeenCalledWith(dto);
    });
  });
});