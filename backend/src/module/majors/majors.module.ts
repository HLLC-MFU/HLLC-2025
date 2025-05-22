import { Module } from '@nestjs/common';
import { MajorsService } from './majors.service';
import { MajorsController } from './majors.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Major, MajorSchema } from './schemas/major.schema';
import { School, SchoolSchema } from '../schools/schemas/school.schema';
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Major.name, schema: MajorSchema },
      { name: School.name, schema: SchoolSchema },
    ]),
  ],
  exports: [MongooseModule],
  controllers: [MajorsController],
  providers: [MajorsService],
})
export class MajorsModule {}
