import { Injectable, Logger } from '@nestjs/common';
import { User, UserDocument } from '../../../module/users/schemas/user.schema';
import { EnrichedUser } from './use-response.interface';
import { Types } from 'mongoose';
import { SharedMetadataService } from '../metadata/metadata.service';
import { Role, RoleDocument } from '../../../module/role/schemas/role.schema';
import { School, SchoolDocument } from '../../../module/schools/schemas/school.schema';
import { Major, MajorDocument } from '../../../module/majors/schemas/major.schema';

// Metadata Enrichment Service
@Injectable()
export class MetadataEnrichmentService {
  private readonly logger = new Logger(MetadataEnrichmentService.name);

  constructor(private readonly metadataService: SharedMetadataService) {}

  async enrichUsersWithMetadata(
    users: UserDocument[],
    roles: Record<string, Role>,
    schools: Record<string, School>,
    majors: Record<string, Major>,
    excluded: string[] = [],
  ): Promise<EnrichedUser[]> {
    return users.map((user: UserDocument) => {
      const userObj = user.toObject();
      const enriched: EnrichedUser = {
        ...userObj,
        metadata: {
          ...userObj.metadata,
          school: undefined,
          major: undefined,
        },
        role: userObj.role,
      };

      if (!excluded.includes('role') && roles[user.role?.toString()]) {
        enriched.role = roles[user.role.toString()];
      }

      if (user.metadata?.schoolId && schools[user.metadata.schoolId.toString()]) {
        enriched.metadata.school = schools[user.metadata.schoolId.toString()];
      }

      if (user.metadata?.majorId && majors[user.metadata.majorId.toString()]) {
        enriched.metadata.major = majors[user.metadata.majorId.toString()];
      }

      return enriched;
    });
  }

  // Directly enrich a single user with metadata
  async enrichUser(user: UserDocument): Promise<EnrichedUser> {
    try {
      const userId = user._id?.toString() || 'unknown';
      this.logger.debug(`Enriching user ${userId}`);
      
      const userObj = user.toObject();
      const enriched: EnrichedUser = {
        ...userObj,
        metadata: {
          ...userObj.metadata,
          school: undefined,
          major: undefined,
        },
        role: userObj.role,
      };

      // Enrich role data if present
      if (user.role) {
        const role = await this.metadataService.getRole(user.role);
        if (role) {
          enriched.role = role;
        }
      }

      // Enrich school data if present in metadata
      if (user.metadata?.schoolId) {
        const school = await this.metadataService.getSchool(user.metadata.schoolId);
        if (school) {
          enriched.metadata.school = school;
        }
      }

      // Enrich major data if present in metadata
      if (user.metadata?.majorId) {
        const major = await this.metadataService.getMajor(user.metadata.majorId);
        if (major) {
          enriched.metadata.major = major;
        }
      }

      return enriched;
    } catch (error) {
      this.logger.error(`Error enriching user: ${error.message}`, error.stack);
      return user.toObject() as unknown as EnrichedUser;
    }
  }
  
  // Batch enrich multiple users with metadata
  async enrichUsers(users: UserDocument[]): Promise<EnrichedUser[]> {
    try {
      this.logger.debug(`Enriching ${users.length} users with metadata`);
      
      // Get all unique IDs
      const roleIds = new Set<string>();
      const schoolIds = new Set<string>();
      const majorIds = new Set<string>();
      
      // Collect all IDs needed
      users.forEach(user => {
        if (user.role) roleIds.add(user.role.toString());
        if (user.metadata?.schoolId) schoolIds.add(user.metadata.schoolId.toString());
        if (user.metadata?.majorId) majorIds.add(user.metadata.majorId.toString());
      });
      
      // Fetch all required metadata in parallel
      const [roles, schools, majors] = await Promise.all([
        this.getRolesData(Array.from(roleIds)),
        this.getSchoolsData(Array.from(schoolIds)),
        this.getMajorsData(Array.from(majorIds))
      ]);
      
      // Enrich all users with fetched metadata
      return this.enrichUsersWithMetadata(users, roles, schools, majors);
    } catch (error) {
      this.logger.error(`Error batch enriching users: ${error.message}`, error.stack);
      return users.map(user => user.toObject() as unknown as EnrichedUser);
    }
  }
  
  // Helper methods to get metadata
  private async getRolesData(roleIds: string[]): Promise<Record<string, Role>> {
    if (!roleIds.length) return {};
    
    try {
      const result: Record<string, Role> = {};
      await Promise.all(
        roleIds.map(async (id) => {
          const role = await this.metadataService.getRole(id);
          if (role) result[id] = role;
        })
      );
      return result;
    } catch (error) {
      this.logger.error(`Error getting roles data: ${error.message}`, error.stack);
      return {};
    }
  }
  
  private async getSchoolsData(schoolIds: string[]): Promise<Record<string, School>> {
    if (!schoolIds.length) return {};
    
    try {
      const result: Record<string, School> = {};
      await Promise.all(
        schoolIds.map(async (id) => {
          const school = await this.metadataService.getSchool(id);
          if (school) result[id] = school;
        })
      );
      return result;
    } catch (error) {
      this.logger.error(`Error getting schools data: ${error.message}`, error.stack);
      return {};
    }
  }
  
  private async getMajorsData(majorIds: string[]): Promise<Record<string, Major>> {
    if (!majorIds.length) return {};
    
    try {
      const result: Record<string, Major> = {};
      await Promise.all(
        majorIds.map(async (id) => {
          const major = await this.metadataService.getMajor(id);
          if (major) result[id] = major;
        })
      );
      return result;
    } catch (error) {
      this.logger.error(`Error getting majors data: ${error.message}`, error.stack);
      return {};
    }
  }
}
