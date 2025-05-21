import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Role } from '../role/schemas/role.schema';
import { RoleSchema } from '../role/schemas/role.schema';
import { MajorsModule } from '../majors/majors.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    MajorsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
