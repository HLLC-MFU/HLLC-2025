import { forwardRef, Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { Role } from './schemas/role.schema';
import { RoleSchema } from './schemas/role.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { CheckinModule } from '../checkin/checkin.module';
import { RoleInitializerService } from './role.initializer.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
    forwardRef(() => CheckinModule),
  ],
  exports: [MongooseModule],
  controllers: [RoleController],
  providers: [RoleService, RoleInitializerService],
})
export class RoleModule {}
