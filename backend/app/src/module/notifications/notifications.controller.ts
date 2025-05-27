import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CacheKey } from '@nestjs/cache-manager';
import { Notification } from './schemas/notification.schema';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @CacheKey('notifcations')
  create(@Body() createNotificationDto: Notification) {
    return this.notificationsService.create(createNotificationDto);
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
  update(@Param('id') id: string, @Body() updateNotificationDto: Partial<Notification>) {
    return this.notificationsService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  @Post('read')
  markAsRead(@Body() body: { userId: string, notificationId: string }) {
    return this.notificationsService.markAsRead(body.userId, body.notificationId);
  }

  @Post('unread')
  markAsUnread(@Body() body: { userId: string, notificationIds: string[] }) {
    return this.notificationsService.markAsUnread(body.userId, body.notificationIds);
  }
}
