import { Module } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { School, SchoolSchema } from './schemas/school.schema';
import { AppearancesModule } from '../appearances/appearances.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: School.name, schema: SchoolSchema }]), AppearancesModule
  ],
  controllers: [SchoolsController],
  providers: [SchoolsService],
  exports: [MongooseModule],
})
export class SchoolsModule { }
