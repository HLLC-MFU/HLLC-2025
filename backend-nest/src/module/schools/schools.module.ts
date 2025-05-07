import { Module } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { School } from './entities/school.entity';
import { SchoolSchema } from './schemas/school.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: School.name, schema: SchoolSchema }])],
  controllers: [SchoolsController],
  providers: [SchoolsService],
})
export class SchoolsModule {}
