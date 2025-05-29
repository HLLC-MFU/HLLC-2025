import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Activities, ActivitiesSchema } from './schema/activities.schema';
import { ActivitiesType, ActivitiesTypeSchema } from '../activities-type/schema/activitiesType.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Major, MajorSchema } from '../majors/schemas/major.schema';
import { School, SchoolSchema } from '../schools/schemas/school.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Activities.name, schema: ActivitiesSchema },
      { name: ActivitiesType.name, schema: ActivitiesTypeSchema },
      { name: User.name, schema: UserSchema },
      { name: Major.name, schema: MajorSchema },
      { name: School.name, schema: SchoolSchema },
      { name: Role.name, schema: RoleSchema }
    ]),
    UsersModule,
  ],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [MongooseModule],
})
export class ActivitiesModule {}
