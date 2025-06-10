import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Major, MajorSchema } from '../majors/schemas/major.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';
import { Activities, ActivitiesSchema } from '../activities/schema/activities.schema';
import { ActivitiesService } from '../activities/service/activities.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Major.name, schema: MajorSchema },
      { name: Activities.name, schema: ActivitiesSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, ActivitiesService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
