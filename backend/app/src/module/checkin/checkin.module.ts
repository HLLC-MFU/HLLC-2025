import { Module } from '@nestjs/common';
import { CheckinService } from './checkin.service';
import { CheckinController } from './checkin.controller';
import { Checkin, CheckinSchema } from './schema/checkin.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Activities,
  ActivitiesSchema,
} from '../activities/schemas/activities.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';
import { Major, MajorSchema } from '../majors/schemas/major.schema';
import { ActivitiesService } from '../activities/services/activities.service';
import { UsersService } from '../users/users.service';
import { RoleService } from '../role/role.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Checkin.name,
        schema: CheckinSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Activities.name,
        schema: ActivitiesSchema,
      },
      {
        name: Role.name,
        schema: RoleSchema,
      },
      {
        name: Major.name,
        schema: MajorSchema,
      },
    ]),
  ],
  exports: [MongooseModule],
  controllers: [CheckinController],
  providers: [CheckinService, ActivitiesService, UsersService, RoleService],
})
export class CheckinModule {}
