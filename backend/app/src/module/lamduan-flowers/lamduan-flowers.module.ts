import { Module } from '@nestjs/common';
import { LamduanFlowersService } from './lamduan-flowers.service';
import { LamduanFlowersController } from './lamduan-flowers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { LamduanFlowers, LamduanFlowersSchema } from './schema/lamduan-flowers.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: LamduanFlowers.name,
      schema: LamduanFlowersSchema
    },
    {
        name: User.name,
        schema: UserSchema
    }
  ]),
  ],
  exports: [MongooseModule],
  controllers: [LamduanFlowersController],
  providers: [LamduanFlowersService],
})
export class LamduanFlowersModule { }
