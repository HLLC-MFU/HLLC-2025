import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activities, ActivityDocument, ActivityScope } from './schema/activities.schema';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll } from 'src/pkg/helper/query.util';
import { UsersService } from '../users/users.service';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activities.name)
    private activitiesModel: Model<ActivityDocument>,
    private usersService: UsersService,
  ) {}

  async create(createActivitiesDto: CreateActivitiesDto) {
    const metadata = createActivitiesDto.metadata || {};
    const scope = metadata.scope || {};
    
    const processedScope = {
      major: this.processFormDataArray(scope.major),
      school: this.processFormDataArray(scope.school),
      user: this.processFormDataArray(scope.user)
    };

    const convertedScope = this.normalizeScope(processedScope);

    const activity = new this.activitiesModel({
      ...createActivitiesDto,
      metadata: {
        isOpen: metadata.isOpen === false ? false : true,
        isProgressCount: metadata.isProgressCount === true ? true : false,
        isVisible: metadata.isVisible === false ? false : true,
        scope: convertedScope,
      },
    });

    try {
      return await activity.save();
    } catch (error) {
      handleMongoDuplicateError(error, 'name');
    }
  }

  private processFormDataArray(value: string | string[] | null | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      if (!value.trim()) return [];
      if (value.includes(',')) return value.split(',').map(v => v.trim()).filter(Boolean);
      return [value.trim()];
    }
    return [];
  }

  async findAll(query: Record<string, string>, user?: { _id: string; role?: { name?: string; permissions?: string[] } }) {
    const hasAccess = user?.role?.permissions?.includes('activities:read') || user?.role?.permissions?.includes('*');
  
    if (hasAccess) {
      return await queryAll<Activities>({
        model: this.activitiesModel,
        query: {
          ...query,
          excluded: 'metadata.scope.user.password,metadata.scope.user.refreshToken,metadata.scope.user.__v,__v',
        },
        filterSchema: {},
        populateFields: () => Promise.resolve([]),
      });
    }
    
  
    const filter: Record<string, boolean | Types.ObjectId> = {
      'metadata.isVisible': true,
      'metadata.isOpen': true,
    };
    if (query.type) {
      filter.type = new Types.ObjectId(query.type);
    }
  
    const activities = await this.activitiesModel.find(filter).lean();

  
    if (!user?._id || !Types.ObjectId.isValid(user._id)) {
      const unrestricted = activities.filter((a: ActivityDocument) => {
        const s = a.metadata?.scope;
        const hasNoScope = !s || (!s.user?.length && !s.major?.length && !s.school?.length);
        return hasNoScope;
      });
      return { data: unrestricted, total: unrestricted.length };
    }
  
    const visible = await Promise.all(
      activities.map(async (a: ActivityDocument) => {
        const allowed = await this.isUserInScope(a, user._id);
        if (!allowed) return null;
  
        const { metadata, ...rest } = a;
        const { scope, ...meta } = metadata;
        return { ...rest, metadata: meta };
      })
    );
  
    const filtered = visible.filter(Boolean);
    
    return { data: filtered, total: filtered.length };
  }
  

  async findOne(id: string, userId: string) {
    const activity = await this.activitiesModel.findById(id).lean();
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new NotFoundException('Access denied');
    }

    const userQuery = await this.usersService.findAllByQuery({
      metadata: { _id: new Types.ObjectId(userId).toString() } as Record<string, string>
    });
    
    const user = userQuery.data[0];
    if (!user) {
      throw new NotFoundException('Access denied');
    }

    if (!(await this.isUserInScope(activity, userId))) {
      throw new NotFoundException('Access denied');
    }

    return activity;
  }

  async update(id: string, updateActivityDto: UpdateActivityDto) {
    if (updateActivityDto.metadata?.scope) {
      const scope = updateActivityDto.metadata.scope;
      const convertedScope = {
        major: (scope.major || []).map(id => id.toString()),
        school: (scope.school || []).map(id => id.toString()),
        user: (scope.user || []).map(id => id.toString()),
      };
      updateActivityDto.metadata.scope = convertedScope;
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

  private async isUserInScope(activity: ActivityDocument, userId: string): Promise<boolean> {
    const scope = activity.metadata?.scope;
    if (!scope) {
      return true;
    }

    const noScope = 
      (!Array.isArray(scope.user) || scope.user.length === 0) && 
      (!Array.isArray(scope.major) || scope.major.length === 0) && 
      (!Array.isArray(scope.school) || scope.school.length === 0);
    
    if (noScope) {
      return true;
    }

    if (!Types.ObjectId.isValid(userId)) {
      return false;
    }
  
    const userResult = await this.usersService.findOne(userId);
    const user = userResult?.data?.[0];
    if (!user) {
      return false;
    }

    if (Array.isArray(scope.user) && scope.user.length > 0) {
      const userMatch = scope.user.some(id => id.toString() === userId);
      if (userMatch) {
        return true;
      }
    }

    const userMajorId = user.metadata?.major?.toString();
    if (userMajorId && Array.isArray(scope.major) && scope.major.length > 0) {
      const majorMatch = scope.major.some(id => id.toString() === userMajorId);
      if (majorMatch) {
        return true;
      }
    }

    if (Array.isArray(scope.school) && scope.school.length > 0) {
      const userResult = await this.usersService.findOneByQuery({ _id: userId });
      const userMajor = userResult?.data?.[0]?.metadata?.major;
      
      if (!userMajor || typeof userMajor !== 'object') {
        return false;
      }

      const majorId = (userMajor as any)._id?.toString();
      const schoolId = (userMajor as any).school?._id?.toString();

      if (!schoolId) {
        return false;
      }

      const schoolMatch = scope.school.some(id => id.toString() === schoolId);
      if (schoolMatch) {
        return true;
      }
      
    }

    return false;
  }
  
  private normalizeScope(scope: {
    major?: (string | Types.ObjectId)[];
    school?: (string | Types.ObjectId)[];
    user?: (string | Types.ObjectId)[];
  }) {
    const clean = (list?: (string | Types.ObjectId)[]) =>
      Array.isArray(list)
        ? list
            .map((id) => id?.toString().trim())
            .filter((id): id is string => Boolean(id && Types.ObjectId.isValid(id)))
            .map((id) => new Types.ObjectId(id))
        : [];
  
    return {
      major: clean(scope.major),
      school: clean(scope.school),
      user: clean(scope.user),
    };
  }

  async findAllWithScope(query: Record<string, string>, userId?: string, isAdmin?: boolean) {
    if (isAdmin) {
      return this.findAll(query);
    }

    const activities = await this.activitiesModel.find({
      ...query,
      'metadata.isVisible': true
    })
    .select('-metadata.scope.user.password -metadata.scope.user.refreshToken -metadata.scope.user.__v')
    .lean();

    if (!userId) {
      return {
        data: activities.filter(activity => {
          const scope = activity.metadata?.scope;
          return !scope || (
            (!scope.user?.length) && 
            (!scope.major?.length) && 
            (!scope.school?.length)
          );
        }),
        total: activities.length
      };
    }

    const accessibleActivities = await Promise.all(
      activities.map(async (activity) => {
        const hasAccess = await this.isUserInScope(activity, userId);
        if (!hasAccess) return null;

        const { metadata, ...rest } = activity;
        const { scope, ...metadataWithoutScope } = metadata;
        
        return {
          ...rest,
          metadata: metadataWithoutScope
        };
      })
    );

    const filteredActivities = accessibleActivities.filter(Boolean);

    return {
      data: filteredActivities,
      total: filteredActivities.length
    };
  }
}