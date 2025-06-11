import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Req,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CacheKey } from '@nestjs/cache-manager';
import { Notification } from './schemas/notification.schema';
import { ReadNotificationDto } from './dto/read-notification.dto';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { UserRequest } from 'src/pkg/types/users';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { FastifyRequest } from 'fastify';
import { PushNotificationDto } from './dto/push-notification.dto';
import { PushNotificationService } from './push-notifications.service';

@UseGuards(PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationService: PushNotificationService
  ) {}

  @Post()
  @CacheKey('notifcations')
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Req() req: FastifyRequest) {
    const dto = req.body as CreateNotificationDto
    return this.notificationsService.create(dto);
  }

  @Get()
  findAll(@Query() query: Record<string, string>) {
    return this.notificationsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: Partial<Notification>,
  ) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  @Post('read')
  markAsRead(@Body() markAsReadDto: ReadNotificationDto) {
    return this.notificationsService.markNotification(markAsReadDto, true);
  }

  @Post('unread')
  markAsUnread(@Body() markAsUnreadDto: ReadNotificationDto) {
    return this.notificationsService.markNotification(markAsUnreadDto, false);
  }

  @Get('me')
  getMyNotifications(@Req() req: UserRequest) {
    const user = req.user;
    return this.notificationsService.getUserNotifications(user);
  }

  @Post('push')
  sendPushNotification(@Body() pushNotificationDto: PushNotificationDto) {
    return this.pushNotificationService.sendPushNotification(pushNotificationDto);
  }
}
