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
import { Notification } from './schemas/notification.schema';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { UserRequest } from 'src/pkg/types/users';
import { MultipartInterceptor } from 'src/pkg/interceptors/multipart.interceptor';
import { PushNotificationDto } from './dto/push-notification.dto';
import { PushNotificationService } from './push-notifications.service';
import { NotificationFormDataPipe } from './pipes/notification-formdata.pipe';

@UseGuards(PermissionsGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Post()
  @UseInterceptors(new MultipartInterceptor(500))
  create(@Body(new NotificationFormDataPipe()) dto: CreateNotificationDto) {
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

  @Post(':id/read')
  markAsRead(@Param('id') notificationId: string, @Req() req: UserRequest) {
    const user = req.user;
    return this.notificationsService.markNotification(user, notificationId, true);
  }

  @Post(':id/unread')
  markAsUnread(@Param('id') notificationId: string, @Req() req: UserRequest) {
    const user = req.user;
    return this.notificationsService.markNotification(user, notificationId, false);
  }

  @Get('me')
  getMyNotifications(@Req() req: UserRequest) {
    const user = req.user;
    return this.notificationsService.getUserNotifications(user);
  }

  @Post('push')
  sendPushNotification(
    @Body() pushNotificationDto: PushNotificationDto,
    @Query('dryRun') dryRun?: string,
  ) {
    const isDryRun = dryRun === 'true';
    return this.pushNotificationService.sendPushNotification(
      pushNotificationDto,
      isDryRun,
    );
  }
}
