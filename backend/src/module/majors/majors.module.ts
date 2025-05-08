import { Module } from '@nestjs/common';
import { MajorsService } from './majors.service';
import { MajorsController } from './majors.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Major, MajorSchema } from './schemas/major.schema';
import { MetadataCacheInterceptor } from '../../pkg/interceptors/metadata-cache.interceptor';
import { MajorInitializerService } from './major.initializer.service';
import { School, SchoolSchema } from '../schools/schemas/school.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Major.name, schema: MajorSchema },
      { name: School.name, schema: SchoolSchema }
    ])
  ],
  controllers: [MajorsController],
  providers: [MajorsService, MetadataCacheInterceptor, MajorInitializerService],
})
export class MajorsModule {}
