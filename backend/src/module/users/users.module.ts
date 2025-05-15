import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Role } from '../role/schemas/role.schema';
import { RoleSchema } from '../role/schemas/role.schema';
import { SharedMetadataModule } from '../../pkg/shared/metadata/metadata.module';
import { SharedEnrichmentModule } from '../../pkg/shared/enrichment/enrichment.module';
import { SerializerInterceptor } from '../../pkg/interceptors/serializer.interceptor';

/**
 * Users Module
 * 
 * This module handles user management functionality including:
 * - User CRUD operations
 * - User metadata management
 * - User authentication support
 */
@Module({
  imports: [
    // Database models registration
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
    ]),
    // Import shared functionality
    SharedMetadataModule,
    SharedEnrichmentModule,
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    SerializerInterceptor, // Add serializer for proper BSON to JSON conversion
  ],
  exports: [UsersService], // Export service for use in other modules (like auth)
})
export class UsersModule {}
