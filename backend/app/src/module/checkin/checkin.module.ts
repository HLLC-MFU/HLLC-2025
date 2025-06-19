import { forwardRef, Module } from '@nestjs/common';
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
import { UsersService } from '../users/users.service';
import { RoleService } from '../role/role.service';
import { ActivitiesModule } from '../activities/activities.module';

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
    forwardRef(() => ActivitiesModule),
  ],
  exports: [MongooseModule],
  controllers: [CheckinController],
  providers: [CheckinService, UsersService, RoleService],
})
export class CheckinModule {}
