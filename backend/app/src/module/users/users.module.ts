import { forwardRef, Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Major, MajorSchema } from '../majors/schemas/major.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';
import {
  Activities,
  ActivitiesSchema,
} from '../activities/schemas/activities.schema';
import { UserInitializerService } from './users.initializer.service';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Major.name, schema: MajorSchema },
      { name: Activities.name, schema: ActivitiesSchema },
    ]),
    forwardRef(() => ActivitiesModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, UserInitializerService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
