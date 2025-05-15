import { Module } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { School, SchoolSchema } from './schemas/school.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedMetadataModule } from '../../pkg/shared/metadata/metadata.module';
import { SharedEnrichmentModule } from '../../pkg/shared/enrichment/enrichment.module';
import { SerializerInterceptor } from '../../pkg/interceptors/serializer.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: School.name, schema: SchoolSchema }]),
    SharedMetadataModule,
    SharedEnrichmentModule,
  ],
  controllers: [SchoolsController],
  providers: [SchoolsService, SerializerInterceptor],
  exports: [SchoolsService],
})
export class SchoolsModule {}
