import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Activities, ActivityDocument, ActivityScope } from './schema/activities.schema';
import { CreateActivitiesDto } from './dto/create-activities.dto';
import { UpdateActivityDto } from './dto/update-activities.dto';
import { UsersService } from '../users/users.service';
import { handleMongoDuplicateError } from 'src/pkg/helper/helpers';
import { queryAll } from 'src/pkg/helper/query.util';

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
    const convertedScope = {
      major: Array.isArray(scope.major) ? scope.major.map(id => new Types.ObjectId(id)) : [
        new Types.ObjectId(scope.major)
      ],
      school: Array.isArray(scope.school) ? scope.school.map(id => new Types.ObjectId(id)) : [
        new Types.ObjectId(scope.school)
      ],
      user: Array.isArray(scope.user)
  ? scope.user.map(id => new Types.ObjectId(id))
  : scope.user
    ? [new Types.ObjectId(scope.user)]
    : []

    };

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

  async findAll(query: Record<string, string>) {
    return await queryAll<Activities>({
      model: this.activitiesModel,
      query: {
        excluded: 'metadata.scope.user.password,metadata.scope.user.refreshToken,metadata.scope.user.__v,__v',
      },
      filterSchema: {},
      populateFields: () => Promise.resolve([]),
    });
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

    // For non-admin users, check scope restrictions
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

  private async isUserInScope(activity: Activities, userId: string): Promise<boolean> {
    const scope = activity.metadata?.scope;
    if (!scope) return true;

    const hasNoScope =
      (!Array.isArray(scope.user) || scope.user.length === 0) &&
      (!Array.isArray(scope.major) || scope.major.length === 0) &&
      (!Array.isArray(scope.school) || scope.school.length === 0);
    if (hasNoScope) return true;

    if (!Types.ObjectId.isValid(userId)) return false;

    const userResponse = await this.usersService.findOne(userId);
    if (!userResponse?.data?.[0]) return false;

    const user = userResponse.data[0];
    const userStr = userId;
    const majorStr = user.metadata?.major?.toString();
 
    const userSet = new Set(Array.isArray(scope.user) ? scope.user.map((id) => id.toString()) : []);
    if (userSet.has(userStr)) return true;

    const majorSet = new Set(Array.isArray(scope.major) ? scope.major.map((id) => id.toString()) : []);
    if (majorStr && majorSet.has(majorStr)) return true;

    if (Array.isArray(scope.school) && scope.school.length > 0 && majorStr) {
      for (const schoolId of scope.school) {
        const schoolUsers = await this.usersService.findAllByQuery({
          school: schoolId.toString(),
        });

        const majorIds = schoolUsers.data
          .map(u => u.metadata?.major?.toString())
          .filter(Boolean);

        if (majorIds.includes(majorStr)) return true;
      }
    }

    return false;
  }

  private normalizeScope(scope: Partial<ActivityScope>) {
    const clean = (list?: string[]) =>
      Array.isArray(list) 
        ? list
            .map((id) => id?.trim())
            .filter((id): id is string => Boolean(id && Types.ObjectId.isValid(id)))
            .map((id) => new Types.ObjectId(id))
        : [];
  
    return {
      major: clean(scope.major?.map(id => id.toString())),
      school: clean(scope.school?.map(id => id.toString())),
      user: clean(scope.user?.map(id => id.toString())),
    };
  }

  // async findAllForUser(query: Record<string, string>, userId?: string) {
  //   const activities = await this.activitiesModel.find({
  //     type: query.type,
  //     'metadata.isVisible': true,
  //     'metadata.isOpen': true,
  //     excluded: 'metadata.scope.user.password,metadata.scope.user.refreshToken,metadata.scope.user.role,metadata.scope.user.metadata,metadata.scope.user.__v,__v'
  //   })
  //     .select('-metadata.scope')
  //     .lean();

  //   if (!userId || !Types.ObjectId.isValid(userId)) {
  //     return activities.filter((a) => {
  //       const s = a.metadata?.scope;
  //       return !s || (!s.user?.length && !s.major?.length && !s.school?.length);
  //     });
  //   }

  //   const visible = await Promise.all(
  //     activities.map(async (a) => {
  //       const isInScope = await this.isUserInScope(a, userId);
  //       if (!isInScope) return null;
        
  //       const { metadata, ...rest } = a;
  //       const { scope, ...metadataWithoutScope } = metadata;
  //       return {
  //         ...rest,
  //         metadata: metadataWithoutScope
  //       };
  //     }),
  //   );

  //   return visible.filter(Boolean);
  // }
}
