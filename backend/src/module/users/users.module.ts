import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Role } from '../role/schemas/role.schema';
import { RoleSchema } from '../role/schemas/role.schema';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { MetadataCacheInterceptor } from '../../pkg/interceptors/metadata-cache.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    {
      provide: APP_INTERCEPTOR,
      useClass: MetadataCacheInterceptor,
    },
  ],
})
export class UsersModule {}
