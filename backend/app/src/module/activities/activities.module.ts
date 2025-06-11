import { Module } from '@nestjs/common';
import { ActivitiesService } from './services/activities.service';
import { ActivitiesController } from './controllers/activities.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Activities, ActivitiesSchema } from './schemas/activities.schema';
import { ActivitiesType, ActivitiesTypeSchema } from './schemas/activitiesType.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Major, MajorSchema } from '../majors/schemas/major.schema';
import { School, SchoolSchema } from '../schools/schemas/school.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';
import { UsersService } from '../users/users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activities.name, schema: ActivitiesSchema },
      { name: ActivitiesType.name, schema: ActivitiesTypeSchema },
      { name: User.name, schema: UserSchema },
      { name: Major.name, schema: MajorSchema },
      { name: School.name, schema: SchoolSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, UsersService],
  exports: [MongooseModule, ActivitiesService],
})
export class ActivitiesModule {}