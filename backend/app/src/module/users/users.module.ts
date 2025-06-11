import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Major, MajorSchema } from '../majors/schemas/major.schema';
import { Role, RoleSchema } from '../role/schemas/role.schema';
import { Activities, ActivitiesSchema } from '../activities/schema/activities.schema';
import { ActivitiesService } from '../activities/service/activities.service';
import { EvoucherCode, EvoucherCodeSchema } from '../evoucher/schema/evoucher-code.schema';
import { Evoucher, EvoucherSchema } from '../evoucher/schema/evoucher.schema';
import { EvoucherCodeService } from '../evoucher/service/evoucher-code.service';
import { EvoucherType, EvoucherTypeSchema } from '../evoucher/schema/evoucher-type.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Major.name, schema: MajorSchema },
      { name: Activities.name, schema: ActivitiesSchema },
      { name: EvoucherCode.name, schema: EvoucherCodeSchema },
      { name: Evoucher.name, schema: EvoucherSchema },
      { name: EvoucherType.name, schema: EvoucherTypeSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService, ActivitiesService, EvoucherCodeService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
