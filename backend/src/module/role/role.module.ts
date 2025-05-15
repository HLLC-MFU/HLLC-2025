import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { Role } from './schemas/role.schema';
import { RoleSchema } from './schemas/role.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { RoleInitializerService } from './role.initializer.service';
import { SharedMetadataModule } from '../../pkg/shared/metadata/metadata.module';
import { SharedEnrichmentModule } from '../../pkg/shared/enrichment/enrichment.module';
import { SerializerInterceptor } from '../../pkg/interceptors/serializer.interceptor';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Role.name, schema: RoleSchema }]),
    SharedMetadataModule,
    SharedEnrichmentModule,
  ],
  controllers: [RoleController],
  providers: [RoleService, RoleInitializerService, SerializerInterceptor],
  exports: [RoleService],
})
export class RoleModule {}
