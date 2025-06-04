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
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CacheKey } from '@nestjs/cache-manager';
import { Notification } from './schemas/notification.schema';
import { ReadNotificationDto } from './dto/notification-read.dto';
import { CreateNotificationDto } from './dto/notification.dto';
import { FastifyRequest } from 'fastify';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@UseGuards(PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @CacheKey('notifcations')
  create(@Body() createNotificationDto: CreateNotificationDto) {
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
    return this.notificationsService.markAsRead(
      markAsReadDto.userId,
      markAsReadDto.notificationId,
    );
  }

  @Post('unread')
  markAsUnread(@Body() markAsUnreadDto: ReadNotificationDto) {
    return this.notificationsService.markAsUnread(
      markAsUnreadDto.userId,
      markAsUnreadDto.notificationId,
    );
  }

  @Get('me')
  getMyNotifications(@Req() req: FastifyRequest) {
    const user = req.user;
    return this.notificationsService.getUserNotifications(
      user?._id,
      user?.major?._id,
      user?.school?._id,
    );
  }
}
