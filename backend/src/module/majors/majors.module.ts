import { Module } from '@nestjs/common';
import { MajorsService } from './majors.service';
import { MajorsController } from './majors.controller';
import { Major, MajorSchema } from './schemas/major.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { SharedMetadataModule } from '../../pkg/shared/metadata/metadata.module';
import { SharedEnrichmentModule } from '../../pkg/shared/enrichment/enrichment.module';
import { SerializerInterceptor } from '../../pkg/interceptors/serializer.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Major.name, schema: MajorSchema }]),
    SharedMetadataModule,
    SharedEnrichmentModule,
  ],
  controllers: [MajorsController],
  providers: [MajorsService, SerializerInterceptor],
  exports: [MajorsService],
})
export class MajorsModule {}
