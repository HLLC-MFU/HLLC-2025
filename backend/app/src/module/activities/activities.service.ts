import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activities, ActivityDocument } from './schema/activities.schema';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';
import { UsersService } from '../users/users.service';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { Role } from '../role/schemas/role.schema';
import { User } from '../users/schemas/user.schema';

type PopulatedUser = Omit<User, 'role'> & {
  role: Role;
};

interface UserWithRole {
  _id: Types.ObjectId;
  role: Role & {
    permissions: string[];
  };
}

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activities.name)
    private activitiesModel: Model<ActivityDocument>,
    private usersService: UsersService,
  ) {}

  async create(createActivitiesDto: CreateActivitiesDto) {
    const metadata = createActivitiesDto.metadata || {};
    const convertedScope = this.normalizeScope(metadata.scope || {});

    const activity = new this.activitiesModel({
      ...createActivitiesDto,
      metadata: {
        isOpen: metadata.isOpen ?? true,
        isProgressCount: metadata.isProgressCount ?? false,
        isVisible: metadata.isVisible ?? true,
        scope: convertedScope,
      },
    });

    try {
      return await activity.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }

  async findAllForUser(query: Record<string, string>, userId?: string) {
    const baseQuery = {
      ...query,
      'metadata.isVisible': true,
      'metadata.isOpen': true,
    };

    const activities = await this.activitiesModel.find(baseQuery)
      .select('-metadata.scope')
      .lean();

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return activities.filter((a) => {
        const s = a.metadata?.scope;
        return !s || (!s.user?.length && !s.major?.length && !s.school?.length);
      });
    }

    const visible = await Promise.all(
      activities.map(async (a) => {
        const isInScope = await this.isUserInScope(a, userId);
        if (!isInScope) return null;
        
        // Return activity without scope information
        const { metadata, ...rest } = a;
        const { scope, ...metadataWithoutScope } = metadata;
        return {
          ...rest,
          metadata: metadataWithoutScope
        };
      }),
    );

    return visible.filter(Boolean);
  }

  async findAllForAdmin(query: Record<string, string>) {
    return this.activitiesModel.find(query).lean();
  }
  
  async findOne(id: string, userId?: string) {
    const activity = await this.activitiesModel.findById(id).lean();
    if (!activity) throw new NotFoundException('Activity not found');

    if (!userId) {
      throw new NotFoundException('Access denied');
    }

    const user = await this.usersService.findOneByQuery({ 
      _id: userId as unknown as Types.ObjectId & string
    }) as unknown as PopulatedUser;
    if (!user) {
      throw new NotFoundException('Access denied');
    }

    // Check if user has admin permissions (wildcard permission)
    const isAdmin = Array.isArray(user.role?.permissions) && user.role.permissions.includes('*');
    if (isAdmin) {
      return activity;
    }

    // For non-admin users, check scope restrictions
    if (!(await this.isUserInScope(activity, userId))) {
      throw new NotFoundException('Access denied');
    }

    try {
      return await this.activitiesModel.findById(id).lean();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    if (updateActivityDto.metadata?.scope) {
      const scope = updateActivityDto.metadata.scope;
      const convertedScope = {
        major: (scope.major || []).map(id => new Types.ObjectId(id)),
        school: (scope.school || []).map(id => new Types.ObjectId(id)),
        user: (scope.user || []).map(id => new Types.ObjectId(id)),
      };
      updateActivityDto.metadata.scope = convertedScope as any;
    }

    const activity = await this.activitiesModel
      .findByIdAndUpdate(id, updateActivityDto, { new: true })
      .lean();

    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    return activity;
  }

  async remove(id: string) {
    await this.activitiesModel.findByIdAndDelete(id).lean();
    
    return {
      message: 'Activity deleted successfully',
      id,
    };
  }

  private async isUserInScope(activity: Activities, userId: string): Promise<boolean> {
    const scope = activity.metadata?.scope;
    if (!scope) return true;

    const hasNoScope =
      !scope.user?.length && !scope.major?.length && !scope.school?.length;
    if (hasNoScope) return true;

    if (!Types.ObjectId.isValid(userId)) return false;
    const user = await this.usersService.findOne(userId);
    if (!user) return false;

    const userStr = user._id.toString();
    const majorStr = user.metadata?.major?.toString();

    const userSet = new Set(scope.user?.map((id) => id.toString()));
    if (userSet.has(userStr)) return true;

    const majorSet = new Set(scope.major?.map((id) => id.toString()));
    if (majorStr && majorSet.has(majorStr)) return true;

    if (scope.school?.length && majorStr) {
      for (const schoolId of scope.school) {
        const schoolUsers = await this.usersService.findAllByQuery({
          school: schoolId.toString(),
        });

        const majorIds = schoolUsers.data
          .map((u) => u.metadata?.major?.toString())
          .filter(Boolean);

        if (majorIds.includes(majorStr)) return true;
      }
    }

    return false;
  }

  private normalizeScope(scope: any) {
    return {
      major: (scope.major || []).map((id) => new Types.ObjectId(id)),
      school: (scope.school || []).map((id) => new Types.ObjectId(id)),
      user: (scope.user || []).map((id) => new Types.ObjectId(id)),
    };
  }
}
