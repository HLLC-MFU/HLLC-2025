import { Module } from '@nestjs/common';
import { StepCountersService } from './step-counters.service';
import { StepCountersController } from './step-counters.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { StepCounter, StepCounterSchema } from './schema/step-counter.schema';
import { School, SchoolSchema } from '../schools/schemas/school.schema';

@Module({
  imports: [MongooseModule.forFeature([
    {
      name: StepCounter.name,
      schema: StepCounterSchema
    },
    {
      name: User.name,
      schema: UserSchema
    },
    {
      name: School.name,
      schema: SchoolSchema
    }]),],
  controllers: [StepCountersController],
  providers: [StepCountersService],
  exports: [StepCountersService]
})
export class StepCountersModule { }
